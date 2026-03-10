import fitz  # PyMuPDF
import base64
import io


class SealExtractor:
    """
    Extracts seal/stamp images from PDF pages using bounding boxes
    detected by PaddleOCR's layout parser (block_label == "seal").
    """

    def extract_seals_from_pdf_pages(self, pdf_bytes, seal_blocks_with_page):
        """
        Crops seal regions from specific PDF pages.
        seal_blocks_with_page: list of (block_dict, page_number, pruned_result)
        Each page has its own coordinate system from PaddleOCR.
        Returns list of dicts with base64 image, page number, and text.
        """
        if not seal_blocks_with_page:
            return []

        seals = []

        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        except Exception as e:
            print(f"  [FAIL] Failed to open PDF for seal extraction: {e}", flush=True)
            return []

        for block, page_num, pruned in seal_blocks_with_page:
            bbox = block.get("block_bbox", [])
            if len(bbox) != 4:
                continue

            x1, y1, x2, y2 = bbox
            block_content = block.get("block_content", "")
            page_width = pruned.get("width", 1191)
            page_height = pruned.get("height", 1684)

            # Use the exact page number (1-indexed -> 0-indexed)
            page_idx = min(page_num - 1, len(doc) - 1)

            try:
                page = doc.load_page(page_idx)
                page_rect = page.rect

                # Scale bounding box from OCR coordinates to PDF coordinates
                scale_x = page_rect.width / page_width
                scale_y = page_rect.height / page_height

                clip_rect = fitz.Rect(
                    x1 * scale_x,
                    y1 * scale_y,
                    x2 * scale_x,
                    y2 * scale_y,
                )

                # Add padding for full seal view
                clip_rect.x0 = max(0, clip_rect.x0 - 10)
                clip_rect.y0 = max(0, clip_rect.y0 - 10)
                clip_rect.x1 = min(page_rect.width, clip_rect.x1 + 10)
                clip_rect.y1 = min(page_rect.height, clip_rect.y1 + 10)

                # Render at high resolution
                mat = fitz.Matrix(3.0, 3.0)
                pix = page.get_pixmap(clip=clip_rect, matrix=mat)

                img_bytes = pix.tobytes("png")
                img_base64 = base64.b64encode(img_bytes).decode("utf-8")

                seals.append({
                    "image_base64": f"data:image/png;base64,{img_base64}",
                    "page": page_num,
                    "text": block_content if block_content else "Seal / Stamp Detected",
                    "confidence": 87.5,
                    "bbox": bbox,
                })

                print(f"  [SEAL] Seal cropped from page {page_num}", flush=True)

            except Exception as e:
                print(f"  [WARN] Failed to crop seal on page {page_num}: {e}", flush=True)

        doc.close()
        return seals

    def extract_seals_from_image(self, img_bytes, seal_blocks, pruned_result):
        """
        Crops seal regions from a raw image using PaddleOCR bounding boxes.
        """
        if not seal_blocks:
            return []

        from PIL import Image
        import io as _io

        seals = []
        page_width = pruned_result.get("width", 1000)
        page_height = pruned_result.get("height", 1000)

        try:
            img = Image.open(_io.BytesIO(img_bytes))
            actual_w, actual_h = img.size
        except Exception as e:
            print(f"  [FAIL] Failed to open image for seal extraction: {e}", flush=True)
            return []

        for block in seal_blocks:
            bbox = block.get("block_bbox", [])
            if len(bbox) != 4:
                continue

            x1, y1, x2, y2 = bbox
            block_content = block.get("block_content", "")

            sx = actual_w / page_width
            sy = actual_h / page_height

            crop_x1 = max(0, int(x1 * sx) - 20)
            crop_y1 = max(0, int(y1 * sy) - 20)
            crop_x2 = min(actual_w, int(x2 * sx) + 20)
            crop_y2 = min(actual_h, int(y2 * sy) + 20)

            try:
                cropped = img.crop((crop_x1, crop_y1, crop_x2, crop_y2))
                buf = _io.BytesIO()
                cropped.save(buf, format="PNG")
                img_base64 = base64.b64encode(buf.getvalue()).decode("utf-8")

                seals.append({
                    "image_base64": f"data:image/png;base64,{img_base64}",
                    "page": 1,
                    "text": block_content if block_content else "Seal / Stamp Detected",
                    "confidence": 87.5,
                    "bbox": bbox,
                })
                print(f"  [SEAL] Seal cropped from image", flush=True)
            except Exception as e:
                print(f"  [WARN] Failed to crop seal from image: {e}", flush=True)

        return seals
