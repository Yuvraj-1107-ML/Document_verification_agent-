import requests
import os

# Configuration
API_URL = "http://localhost:8000/upload"
TEST_FILE = "e:/CGMSCL_new_requirement/ocr-poc/sample_docs/test_doc.jpg" # Adjust this path

def test_upload():
    if not os.path.exists(TEST_FILE):
        print(f"Error: Test file not found at {TEST_FILE}")
        print("Please place a sample image or PDF in that location first.")
        return

    print(f"Uploading {TEST_FILE} to {API_URL}...")
    
    with open(TEST_FILE, "rb") as f:
        files = {"file": (os.path.basename(TEST_FILE), f, "image/jpeg")}
        data = {"fileType": 1} # 1 for Image
        
        try:
            response = requests.post(API_URL, files=files, data=data)
            print(f"Status Code: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print("Upload Successful!")
                print(f"Job ID: {result.get('job_id')}")
                
                # Fetch results
                job_id = result.get('job_id')
                res_resp = requests.get(f"http://localhost:8000/result/{job_id}")
                print("\nExtracted Fields:")
                print(res_resp.json().get('fields'))
                print(f"\nSeals Detected: {len(res_resp.json().get('seals', []))}")
            else:
                print(f"Error: {response.text}")
        except Exception as e:
            print(f"Request failed: {e}")

if __name__ == "__main__":
    test_upload()
