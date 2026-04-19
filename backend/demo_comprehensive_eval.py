import asyncio
import os
import json
from dotenv import load_dotenv

from ocr_service import OCRService
from comprehensive_evaluator import ComprehensiveEvaluator

load_dotenv()

async def evaluate_firm_documents(directory_path: str, firm_name: str, output_excel: str):
    """
    Reads all PDFs/images in a folder, extracts text using PaddleOCR,
    combines the text, and evaluates against the 26 points.
    """
    print(f"Starting Comprehensive Evaluation for firm: {firm_name}\n")
    
    ocr_service = OCRService()
    evaluator = ComprehensiveEvaluator()
    
    all_combined_text = ""
    file_count = 0
    
    for filename in os.listdir(directory_path):
        filepath = os.path.join(directory_path, filename)
        ext = os.path.splitext(filename)[1].lower()
        
        file_type = None
        if ext == ".pdf":
            file_type = 0
        elif ext in [".jpg", ".jpeg", ".png", ".tif", ".tiff"]:
            file_type = 1
            
        if file_type is not None:
            file_count += 1
            print(f"[{file_count}] Extracting text from {filename}...")
            
            with open(filepath, "rb") as f:
                file_bytes = f.read()
                
            ocr_result = await ocr_service.process_file(file_bytes, file_type=file_type)
            if not ocr_result:
                print(f"  --> OCR Failed for {filename}")
                continue
                
            layout_results = ocr_result.get("layoutParsingResults", [])
            doc_text = f"\n\n--- DOCUMENT: {filename} ---\n"
            
            for page in layout_results:
                pruned = page.get("prunedResult", {})
                for block in pruned.get("parsing_res_list", []):
                    if block.get("block_content"):
                        doc_text += block["block_content"] + "\n"
                        
            all_combined_text += doc_text
            print(f"  --> Extracted {len(doc_text)} characters.")
            
    print(f"\nTotal characters to evaluate: {len(all_combined_text)}")
    print("Sending combined text to AI Evaluator (GPT-4o) for 26-point analysis...\n")
    
    # Run comprehensive evaluation
    evaluations = evaluator.evaluate_all_documents(all_combined_text)
    
    if assessments := evaluations:
        print(f"Successfully extracted {len(assessments)} checklist items!")
        evaluator.export_to_excel(evaluations, firm_name, output_excel)
        print(f"\nSaved final evaluation summary to: {output_excel}")
        print("You can open this file in Excel to see the generated Technical Evaluation Sheet.")
    else:
        print("Evaluation failed. Please check logs.")

if __name__ == "__main__":
    # Ensure you create a folder named 'sample_firm_docs' with PDFs inside to test this script!
    sample_dir = r"e:\CGMSCL_new_requirement\ocr-poc\Pfizer"
    
    if os.path.exists(sample_dir):
        asyncio.run(evaluate_firm_documents(
            directory_path=sample_dir,
            firm_name="PFIZER LIMITED (Demo)",
            output_excel="Comprehensive_Evaluation_Pfizer.xlsx"
        ))
    else:
        print(f"Please place PDFs in {sample_dir} before running.")
