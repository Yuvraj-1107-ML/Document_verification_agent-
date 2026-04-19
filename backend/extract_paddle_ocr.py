import asyncio
import os
import sys
import json
from ocr_service import OCRService

async def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_paddle_ocr.py <file_path>")
        return

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    print(f"Reading file: {file_path}")
    with open(file_path, "rb") as f:
        file_bytes = f.read()

    # Determine file type (0 for PDF, 1 for Image)
    ext = os.path.splitext(file_path)[1].lower()
    file_type = 0 if ext == ".pdf" else 1

    service = OCRService()
    print("Sending to PaddleOCR API...")
    result = await service.process_file(file_bytes, file_type=file_type)

    if not result:
        print("OCR processing failed.")
        return

    layout_results = result.get("layoutParsingResults", [])
    if not layout_results:
        print("No layout results found.")
        return

    all_text = ""
    print(f"Processing {len(layout_results)} pages...")
    
    for page_idx, page_result in enumerate(layout_results):
        pruned = page_result.get("prunedResult", {})
        parsing_res_list = pruned.get("parsing_res_list", [])
        
        page_text = f"--- Page {page_idx + 1} ---\n"
        for block in parsing_res_list:
            content = block.get("block_content", "")
            if content:
                page_text += content + "\n"
        
        all_text += page_text + "\n"

    output_file = os.path.splitext(file_path)[0] + "_extracted.txt"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(all_text)

    print(f"Extraction complete. Results saved to: {output_file}")
    # Also print a snippet
    print("\nSnippet of extracted text:")
    print("-" * 20)
    print(all_text[:1000] + "..." if len(all_text) > 1000 else all_text)
    print("-" * 20)

if __name__ == "__main__":
    asyncio.run(main())
