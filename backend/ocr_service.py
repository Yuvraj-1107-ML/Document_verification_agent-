import base64
import hashlib
import httpx
import json
import os
import asyncio
import time

CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "ocr_cache")


class OCRService:
    def __init__(self):
        self.job_url = "https://paddleocr.aistudio-app.com/api/v2/ocr/jobs"
        # New API Key provided by user
        self.token = "a93f4d8b4242c84c46acab3d25bafad104f4bbc2"
        self.model = "PaddleOCR-VL-1.5"
        self.headers = {
            "Authorization": f"bearer {self.token}",
        }
        os.makedirs(CACHE_DIR, exist_ok=True)

    def _get_cache_key(self, file_bytes: bytes) -> str:
        """Generate a unique cache key from file content using MD5."""
        return hashlib.md5(file_bytes).hexdigest()

    def _load_from_cache(self, cache_key: str):
        cache_path = self._get_cache_path(cache_key)
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return None
        return None

    def _get_cache_path(self, cache_key: str) -> str:
        return os.path.join(CACHE_DIR, f"{cache_key}.json")

    def _save_to_cache(self, cache_key: str, result: dict):
        cache_path = self._get_cache_path(cache_key)
        try:
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(result, f)
        except Exception as e:
            print(f"  [WARN] Failed to save OCR cache: {e}", flush=True)

    async def process_file(self, file_bytes, file_type=0):
        """
        Sends a file to PaddleOCR layout-parsing Job API (v2).
        Uses MD5-based file cache to skip API call for duplicate documents.
        file_type: 0 = PDF, 1 = Image (unused in current job API payload, but kept for compatibility)
        """
        cache_key = self._get_cache_key(file_bytes)
        cached = self._load_from_cache(cache_key)

        if cached is not None:
            print(f"  [CACHE HIT] Skipping OCR API -- using cached result", flush=True)
            return cached

        print(f"  [CACHE MISS] Calling PaddleOCR Async Job API...", flush=True)

        optional_payload = {
            "useDocOrientationClassify": False,
            "useDocUnwarping": False,
            "useChartRecognition": False,
        }

        # Submission
        data = {
            "model": self.model,
            "optionalPayload": json.dumps(optional_payload)
        }
        
        async with httpx.AsyncClient(timeout=300) as client:
            try:
                # Submit job
                files = {"file": ("document", file_bytes)}
                response = await client.post(
                    self.job_url, 
                    headers=self.headers, 
                    data=data, 
                    files=files
                )
                
                if response.status_code != 200:
                    print(f"  [FAIL] Job submission failed: {response.text}", flush=True)
                    return None
                
                job_id = response.json()["data"]["jobId"]
                print(f"  [SUBMITTED] Job ID: {job_id}. Polling for results...", flush=True)

                # Polling
                jsonl_url = ""
                max_polls = 60 # 5 mins
                poll_count = 0
                
                while poll_count < max_polls:
                    job_result_response = await client.get(f"{self.job_url}/{job_id}", headers=self.headers)
                    if job_result_response.status_code != 200:
                         print(f"  [WARN] Poll failed for job {job_id}: {job_result_response.status_code}", flush=True)
                         await asyncio.sleep(5)
                         poll_count += 1
                         continue

                    data_resp = job_result_response.json()["data"]
                    state = data_resp["state"]
                    
                    if state == 'done':
                        jsonl_url = data_resp['resultUrl']['jsonUrl']
                        break
                    elif state == "failed":
                        error_msg = data_resp.get('errorMsg', 'Unknown error')
                        print(f"  [FAIL] Job failed: {error_msg}", flush=True)
                        return None
                    
                    # Log progress if available
                    progress = data_resp.get('extractProgress', {})
                    if state == 'running' and 'totalPages' in progress:
                        print(f"  [POLLING] Job {job_id} running ({progress.get('extractedPages', 0)}/{progress.get('totalPages', 0)})", flush=True)
                    else:
                        print(f"  [POLLING] Job {job_id} is {state}", flush=True)

                    await asyncio.sleep(5)
                    poll_count += 1

                if not jsonl_url:
                    print(f"  [TIMEOUT] Job {job_id} did not complete in time", flush=True)
                    return None

                # Fetch Results
                jsonl_response = await client.get(jsonl_url)
                jsonl_response.raise_for_status()
                
                # The result is a JSONL. The service expects a combined "result" object 
                # similar to the old API which returned everything at once.
                # Usually layoutParsingResults is a list of results per page.
                
                lines = jsonl_response.text.strip().split('\n')
                combined_layout_results = []
                for line in lines:
                    if not line.strip(): continue
                    line_data = json.loads(line)
                    # The job result structure might slightly differ, let's map it back to 
                    # the expected "layoutParsingResults" format
                    page_result = line_data.get("result", {})
                    # If the page_result itself contains layoutParsingResults list (some APIs do), 
                    # otherwise it IS the layout result.
                    if "layoutParsingResults" in page_result:
                         combined_layout_results.extend(page_result["layoutParsingResults"])
                    else:
                         combined_layout_results.append(page_result)

                final_result = {
                    "layoutParsingResults": combined_layout_results
                }

                # Save to cache for future use
                self._save_to_cache(cache_key, final_result)
                print(f"  [SUCCESS] OCR complete and cached (key: {cache_key[:8]}...)", flush=True)

                return final_result

            except Exception as e:
                print(f"  [FAIL] PaddleOCR Service error: {str(e)[:300]}", flush=True)
                return None

