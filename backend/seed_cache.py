"""
Pre-seed the OCR cache from existing analysis_output JSON files.
Extracts PDFs from sample_docs.zip, computes their MD5 hash,
and maps them to the corresponding cached OCR results.
"""
import hashlib
import json
import os
import zipfile
import shutil

CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "ocr_cache")
ANALYSIS_DIR = os.path.join(os.path.dirname(__file__), "..", "analysis_output")
SAMPLE_ZIP = os.path.join(os.path.dirname(__file__), "..", "sample_docs.zip")
SAMPLE_DIR = os.path.join(os.path.dirname(__file__), "..", "sample_docs")

os.makedirs(CACHE_DIR, exist_ok=True)

# Map analysis filenames to the actual PDF filenames
ANALYSIS_MAP = {
    "4-184703_Pfizer Limited_4COPPandGMPDruglabelProductliteratureIEC": 
        "4-184703_Pfizer Limited_4COPPandGMPDruglabelProductliteratureIEC_response.json",
    "6-184703_Pfizer Limited_6MarketstandingcertBOEandCOA": 
        "6-184703_Pfizer Limited_6MarketstandingcertBOEandCOA_response.json",
}

def get_md5(data: bytes) -> str:
    return hashlib.md5(data).hexdigest()

def seed_from_analysis(pdf_bytes: bytes, pdf_name: str):
    """Check if we have an analysis JSON for this PDF and seed the cache."""
    base = os.path.splitext(pdf_name)[0]
    
    # Find matching analysis file
    analysis_file = None
    for key, fname in ANALYSIS_MAP.items():
        if key in base or base in key:
            analysis_file = os.path.join(ANALYSIS_DIR, fname)
            break
    
    if not analysis_file or not os.path.exists(analysis_file):
        # Try fuzzy match
        for fname in os.listdir(ANALYSIS_DIR):
            if fname.endswith("_response.json"):
                prefix = fname.replace("_response.json", "")
                if prefix in base or base in prefix:
                    analysis_file = os.path.join(ANALYSIS_DIR, fname)
                    break
    
    if not analysis_file or not os.path.exists(analysis_file):
        print(f"  No analysis file found for: {pdf_name}")
        return False
    
    md5_hash = get_md5(pdf_bytes)
    cache_path = os.path.join(CACHE_DIR, f"{md5_hash}.json")
    
    if os.path.exists(cache_path):
        print(f"  Cache already exists for: {pdf_name} ({md5_hash[:8]}...)")
        return True
    
    # Load analysis JSON and extract the "result" key
    with open(analysis_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    result = data.get("result", data)  # Use "result" if present, else whole file
    
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(result, f)
    
    print(f"  CACHED: {pdf_name} -> {md5_hash[:8]}... ({os.path.getsize(cache_path) / 1024:.0f} KB)")
    return True

def main():
    seeded = 0
    
    # 1. Process PDFs from sample_docs.zip
    if os.path.exists(SAMPLE_ZIP):
        print(f"\nProcessing: {SAMPLE_ZIP}")
        with zipfile.ZipFile(SAMPLE_ZIP, 'r') as zf:
            for name in zf.namelist():
                if name.lower().endswith('.pdf') and not name.startswith('__MACOSX'):
                    pdf_bytes = zf.read(name)
                    basename = os.path.basename(name)
                    print(f"\n  PDF: {basename} ({len(pdf_bytes) / 1024:.0f} KB)")
                    if seed_from_analysis(pdf_bytes, basename):
                        seeded += 1
    
    # 2. Process standalone PDFs in sample_docs/
    if os.path.exists(SAMPLE_DIR):
        print(f"\nProcessing: {SAMPLE_DIR}")
        for fname in os.listdir(SAMPLE_DIR):
            if fname.lower().endswith('.pdf'):
                fpath = os.path.join(SAMPLE_DIR, fname)
                with open(fpath, "rb") as f:
                    pdf_bytes = f.read()
                print(f"\n  PDF: {fname} ({len(pdf_bytes) / 1024:.0f} KB)")
                if seed_from_analysis(pdf_bytes, fname):
                    seeded += 1
    
    print(f"\n{'='*50}")
    print(f"Cache seeded: {seeded} documents")
    print(f"Cache directory: {os.path.abspath(CACHE_DIR)}")
    print(f"Cache files: {len(os.listdir(CACHE_DIR))}")

if __name__ == "__main__":
    main()
