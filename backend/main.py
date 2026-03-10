from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
import uvicorn
import os
import fitz  # PyMuPDF
import uuid
import json
import base64
import time
import zipfile
import io
from ocr_service import OCRService
from llm_extractor import LLMExtractor
from seal_extractor import SealExtractor
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="DocVerify AI - Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ocr_service = OCRService()
llm_extractor = LLMExtractor()
seal_extractor = SealExtractor()

results_db = {}

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"}

DOC_TYPE_LABELS = {
    "copp-whogmp": "COPP / WHO GMP Certificate",
    "mmc": "MMC / Market Standing Certificate",
    "manufacturing-license": "Manufacturing License",
}


def detect_doc_type(filename: str) -> str:
    lower = filename.lower()
    if "copp" in lower or "gmp" in lower or "whogmp" in lower:
        return "copp-whogmp"
    if "mmc" in lower or "market" in lower:
        return "mmc"
    if "import" in lower or "sale" in lower or "license" in lower:
        return "manufacturing-license"
    return "manufacturing-license"


def detect_file_format(filename: str, contents: bytes) -> str:
    ext = os.path.splitext(filename)[1].lower()
    if ext == ".zip" or (len(contents) > 4 and contents[:4] == b'PK\x03\x04'):
        return "zip"
    if ext == ".pdf" or (len(contents) > 5 and contents[:5] == b'%PDF-'):
        return "pdf"
    if ext in IMAGE_EXTENSIONS:
        return "image"
    if len(contents) > 4 and contents[:4] == b'PK\x03\x04':
        return "zip"
    if len(contents) > 5 and contents[:5] == b'%PDF-':
        return "pdf"
    return "image"


def sse_event(event: str, data: dict) -> str:
    """Format a Server-Sent Event string."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@app.post("/api/process-stream")
async def process_upload_stream(file: UploadFile = File(...)):
    """
    Streaming endpoint that sends real-time processing logs via SSE.
    Final event contains the complete result JSON.
    """
    job_id = str(uuid.uuid4())
    contents = await file.read()
    file_format = detect_file_format(file.filename, contents)

    async def generate():
        yield sse_event("log", {
            "message": f"File received: {file.filename} ({len(contents) / 1024:.0f} KB)",
            "step": "upload",
            "progress": 5,
        })
        yield sse_event("log", {
            "message": f"Detected format: {file_format.upper()}",
            "step": "detect",
            "progress": 8,
        })

        documents = []
        doc_counter = 0
        doc_files_to_process = []

        # Prepare file list
        if file_format == "zip":
            try:
                with zipfile.ZipFile(io.BytesIO(contents), 'r') as zf:
                    all_names = [f for f in zf.namelist()
                                 if not f.startswith('__MACOSX') and not f.endswith('/')]
                    for name in all_names:
                        ext = os.path.splitext(name)[1].lower()
                        if ext == ".pdf" or ext in IMAGE_EXTENSIONS:
                            doc_files_to_process.append({
                                "name": name,
                                "bytes": zf.read(name),
                                "file_type": 0 if ext == ".pdf" else 1,
                            })

                yield sse_event("log", {
                    "message": f"ZIP extracted: {len(doc_files_to_process)} documents found",
                    "step": "extract",
                    "progress": 12,
                })
            except zipfile.BadZipFile:
                yield sse_event("log", {
                    "message": "Not a valid ZIP. Treating as single file...",
                    "step": "fallback",
                    "progress": 10,
                })
                doc_files_to_process.append({
                    "name": file.filename,
                    "bytes": contents,
                    "file_type": 0,
                })
        else:
            ft = 0 if file_format == "pdf" else 1
            doc_files_to_process.append({
                "name": file.filename,
                "bytes": contents,
                "file_type": ft,
            })

        total_docs = len(doc_files_to_process)

        for doc_idx, doc_info in enumerate(doc_files_to_process):
            doc_name = os.path.basename(doc_info["name"])
            doc_type = detect_doc_type(doc_name)
            doc_label = DOC_TYPE_LABELS.get(doc_type, doc_type)
            base_progress = 15 + int((doc_idx / max(total_docs, 1)) * 75)

            yield sse_event("log", {
                "message": f"[{doc_idx+1}/{total_docs}] Processing: {doc_name}",
                "step": "process",
                "progress": base_progress,
            })

            yield sse_event("log", {
                "message": f"  Auto-classified as: {doc_label}",
                "step": "classify",
                "progress": base_progress + 2,
            })

            # OCR
            # Check if this document is cached
            import hashlib
            cache_key = hashlib.md5(doc_info["bytes"]).hexdigest()
            is_cached = ocr_service._load_from_cache(cache_key) is not None

            if is_cached:
                yield sse_event("log", {
                    "message": f"  OCR cache found! Skipping API call...",
                    "step": "ocr_cache",
                    "progress": base_progress + 5,
                })
            else:
                yield sse_event("log", {
                    "message": f"  Running PaddleOCR layout analysis (this may take a while)...",
                    "step": "ocr",
                    "progress": base_progress + 5,
                })

            start = time.time()
            ocr_result = await ocr_service.process_file(doc_info["bytes"], file_type=doc_info["file_type"])
            elapsed = time.time() - start

            if not ocr_result:
                yield sse_event("log", {
                    "message": f"  OCR failed for {doc_name}. Skipping.",
                    "step": "ocr_fail",
                    "progress": base_progress + 15,
                })
                continue

            layout_results = ocr_result.get("layoutParsingResults", [])
            if not layout_results:
                yield sse_event("log", {
                    "message": f"  No text detected in {doc_name}. Skipping.",
                    "step": "ocr_empty",
                    "progress": base_progress + 15,
                })
                continue
            # Each layoutParsingResult = one page of the document
            total_pages = len(layout_results)
            all_text = ""
            seal_blocks_with_page = []  # list of (block, page_num, pruned)

            for page_idx, page_result in enumerate(layout_results):
                pruned = page_result.get("prunedResult", {})
                parsing_res_list = pruned.get("parsing_res_list", [])

                for block in parsing_res_list:
                    label = block.get("block_label", "")
                    content = block.get("block_content", "")
                    if label == "seal":
                        seal_blocks_with_page.append((block, page_idx + 1, pruned))
                    if content:
                        all_text += content + "\n"

            cache_msg = f"(from cache)" if elapsed < 2 else f"in {elapsed:.1f}s"
            yield sse_event("log", {
                "message": f"  OCR complete {cache_msg} -- {total_pages} pages, {len(all_text)} chars extracted",
                "step": "ocr_done",
                "progress": base_progress + 20,
            })

            # Seals - extract from each page
            seal_images = []
            if seal_blocks_with_page:
                yield sse_event("log", {
                    "message": f"  {len(seal_blocks_with_page)} seal(s) detected across {total_pages} pages. Extracting images...",
                    "step": "seal",
                    "progress": base_progress + 25,
                })

            if doc_info["file_type"] == 0:
                seal_images = seal_extractor.extract_seals_from_pdf_pages(
                    doc_info["bytes"], seal_blocks_with_page
                )
            else:
                # For images, use the first page's pruned result
                first_pruned = layout_results[0].get("prunedResult", {})
                plain_blocks = [b for b, _, _ in seal_blocks_with_page]
                seal_images = seal_extractor.extract_seals_from_image(
                    doc_info["bytes"], plain_blocks, first_pruned
                )

            # LLM
            yield sse_event("log", {
                "message": f"  Extracting fields with AI (GPT-4o)...",
                "step": "llm",
                "progress": base_progress + 30,
            })

            extracted_fields = llm_extractor.extract_fields(all_text, doc_type)

            yield sse_event("log", {
                "message": f"  AI extracted {len(extracted_fields)} fields successfully",
                "step": "llm_done",
                "progress": base_progress + 40,
            })

            # Add seals to fields
            for i, seal in enumerate(seal_images):
                extracted_fields.append({
                    "id": f"{job_id}-seal-{i}",
                    "fieldName": f"Seal / Stamp #{i+1}",
                    "extractedValue": f"Detected -- {seal.get('text', 'Seal Region')}",
                    "confidence": seal.get("confidence", 85.0),
                    "verified": False,
                    "page": seal.get("page", 1),
                    "sealImage": seal.get("image_base64", ""),
                })

            for idx, field in enumerate(extracted_fields):
                if "id" not in field or not field["id"]:
                    field["id"] = f"{job_id}-{doc_type[:2]}-{idx}"

            doc_counter += 1
            documents.append({
                "id": f"doc-{doc_counter}",
                "fileName": doc_name,
                "docType": doc_type,
                "totalPages": total_pages,
                "uploadedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "fields": extracted_fields,
            })

            yield sse_event("log", {
                "message": f"  Done: {doc_name} ({len(extracted_fields)} fields, {len(seal_images)} seals)",
                "step": "doc_done",
                "progress": base_progress + 45,
            })

        # Final result
        result = {
            "zipName": file.filename,
            "documents": documents,
        }
        results_db[job_id] = result

        yield sse_event("log", {
            "message": f"All {len(documents)} documents processed successfully!",
            "step": "complete",
            "progress": 100,
        })

        yield sse_event("result", result)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# Keep the non-streaming endpoint as fallback
@app.post("/api/process")
async def process_upload(file: UploadFile = File(...)):
    job_id = str(uuid.uuid4())
    contents = await file.read()
    file_format = detect_file_format(file.filename, contents)
    print(f"\n[RECEIVED] {file.filename} ({len(contents)} bytes) -> format: {file_format}", flush=True)

    documents = []
    doc_counter = 0
    doc_files = []

    if file_format == "zip":
        try:
            with zipfile.ZipFile(io.BytesIO(contents), 'r') as zf:
                for name in zf.namelist():
                    if name.startswith('__MACOSX') or name.endswith('/'):
                        continue
                    ext = os.path.splitext(name)[1].lower()
                    if ext == ".pdf" or ext in IMAGE_EXTENSIONS:
                        doc_files.append({"name": name, "bytes": zf.read(name), "ft": 0 if ext == ".pdf" else 1})
        except zipfile.BadZipFile:
            file_format = "pdf"

    if file_format in ("pdf", "image"):
        ft = 0 if file_format == "pdf" else 1
        doc_files.append({"name": file.filename, "bytes": contents, "ft": ft})

    for df in doc_files:
        doc_type = detect_doc_type(df["name"])
        base_name = os.path.basename(df["name"])
        ocr_result = await ocr_service.process_file(df["bytes"], file_type=df["ft"])
        if not ocr_result:
            continue
        layout_results = ocr_result.get("layoutParsingResults", [])
        if not layout_results:
            continue

        # Iterate ALL pages (each layoutParsingResult = one page)
        all_text = ""
        seal_blocks_with_page = []
        for page_idx, page_result in enumerate(layout_results):
            pruned = page_result.get("prunedResult", {})
            for block in pruned.get("parsing_res_list", []):
                if block.get("block_content"):
                    all_text += block["block_content"] + "\n"
                if block.get("block_label") == "seal":
                    seal_blocks_with_page.append((block, page_idx + 1, pruned))

        if df["ft"] == 0:
            seal_images = seal_extractor.extract_seals_from_pdf_pages(df["bytes"], seal_blocks_with_page)
        else:
            first_pruned = layout_results[0].get("prunedResult", {})
            plain_blocks = [b for b, _, _ in seal_blocks_with_page]
            seal_images = seal_extractor.extract_seals_from_image(df["bytes"], plain_blocks, first_pruned)

        extracted_fields = llm_extractor.extract_fields(all_text, doc_type)
        for i, seal in enumerate(seal_images):
            extracted_fields.append({
                "id": f"{job_id}-seal-{i}", "fieldName": f"Seal / Stamp #{i+1}",
                "extractedValue": f"Detected -- {seal.get('text', 'Seal Region')}",
                "confidence": seal.get("confidence", 85.0), "verified": False,
                "page": seal.get("page", 1), "sealImage": seal.get("image_base64", ""),
            })
        for idx, f in enumerate(extracted_fields):
            if not f.get("id"):
                f["id"] = f"{job_id}-{doc_type[:2]}-{idx}"
        doc_counter += 1
        documents.append({
            "id": f"doc-{doc_counter}", "fileName": base_name, "docType": doc_type,
            "totalPages": pruned.get("page_count", 1),
            "uploadedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ"), "fields": extracted_fields,
        })

    return {"zipName": file.filename, "documents": documents}


@app.get("/api/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
