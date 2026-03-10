import re
import json

class FieldExtractor:
    def __init__(self, config_path):
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        self.fields = self.config['fields']

    def extract(self, ocr_results):
        """
        ocr_results: The 'layoutParsingResults' from PaddleOCR API
        """
        extracted_data = {}
        full_text = ""
        
        # Combine all markdown text from all pages
        for result in ocr_results:
            full_text += result.get("markdown", {}).get("text", "") + "\n"

        for field in self.fields:
            name = field['name']
            pattern = field['pattern']
            
            # Use findall in case there are multiple (like licenses)
            matches = re.findall(pattern, full_text, re.IGNORECASE | re.DOTALL)
            
            if matches:
                # Store all matches or just the first one depending on logic
                # For this POC, we'll store them as field_1, field_2 if multiple matches exist for same pattern
                if len(matches) == 1:
                    extracted_data[name] = matches[0].strip()
                else:
                    for i, match in enumerate(matches):
                        extracted_data[f"{name}_{i+1}"] = match.strip()
            else:
                extracted_data[name] = "Not Found"

        return extracted_data

if __name__ == "__main__":
    # Test with sample text
    sample_text = "This is to certify that M/s Intas Pharmaceuticals Ltd., Camp Road, Selaqui, Dehradun, Uttarakhand (India) is holding drugs manufacturing license No 15/UA/2006 on form 25 & license No 15/UA/SC/P-2006 on form 28. valid up to 11-10-2025"
    
    # Mock OCR result
    mock_results = [{"markdown": {"text": sample_text}}]
    
    extractor = FieldExtractor("e:/CGMSCL_new_requirement/ocr-poc/backend/fields_config.json")
    results = extractor.extract(mock_results)
    print(json.dumps(results, indent=2))
