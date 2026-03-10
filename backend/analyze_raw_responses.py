import base64
import os
import requests
import json
import time

API_URL = "https://s2d3c8h3t257f4qe.aistudio-app.com/layout-parsing"
TOKEN = "438bf23a36ab26de13bb11d1c138e59bc23bc0cb"

headers = {
    "Authorization": f"token {TOKEN}",
    "Content-Type": "application/json"
}

def process_document(file_path, output_json):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    print(f"Processing {file_path}...")
    file_ext = os.path.splitext(file_path)[1].lower()
    file_type = 0 if file_ext == '.pdf' else 1

    with open(file_path, "rb") as file:
        file_data = base64.b64encode(file.read()).decode("ascii")

    payload = {
        "file": file_data,
        "fileType": file_type,
        "useDocOrientationClassify": False,
        "useDocUnwarping": False,
        "useChartRecognition": False,
    }

    start_time = time.time()
    response = requests.post(API_URL, json=payload, headers=headers)
    end_time = time.time()

    print(f"Status Code: {response.status_code} | Time: {end_time - start_time:.2f}s")

    if response.status_code == 200:
        with open(output_json, "w") as f:
            json.dump(response.json(), f, indent=2)
        print(f"Saved raw response to {output_json}")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    # Create sample docs directory if it doesn't exist
    sample_dir = r"e:\CGMSCL_new_requirement\ocr-poc\sample_docs"
    output_dir = r"e:\CGMSCL_new_requirement\ocr-poc\analysis_output"
    os.makedirs(output_dir, exist_ok=True)

    # List of files to process - REPLACE THESE WITH ACTUAL FILENAMES
    docs_to_test = [
        "4-184703_Pfizer Limited_4COPPandGMPDruglabelProductliteratureIEC.pdf",
        "6-184703_Pfizer Limited_6MarketstandingcertBOEandCOA.pdf",
        "3-184703_Pfizer Limited_3ImportlicenseSaledruglicenseProductpermissionandPOA.pdf"
    ]

    for doc in docs_to_test:
        doc_path = os.path.join(sample_dir, doc)
        output_path = os.path.join(output_dir, f"{os.path.splitext(doc)[0]}_response.json")
        process_document(doc_path, output_path)
