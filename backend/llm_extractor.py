import os
import json
from openai import AzureOpenAI

# Field schemas per document type
FIELD_SCHEMAS = {
    "manufacturing-license": [
        "Company Name",
        "Company Address",
        "Manufacturing Licence No. (Form 25)",
        "Manufacturing Licence No. (Form 28)",
        "Valid Up To",
        "Retention Date",
    ],
    "copp-whogmp": [
        "Certificate Number",
        "Dosage Form",
        "Active Substance",
        "Importing Country",
    ],
    "mmc": [
        "Company Name",
        "Company Address",
        "Financial Period (Year 1)",
        "Financial Period (Year 2)",
        "Financial Period (Year 3)",
        "Product Name",
        "Drug Code",
        "Import License No./Manufacturing License No./loan License No.",
        "Dosage Form/pack size",
        "Date",
        "FDA Address"

    ],
}


class LLMExtractor:
    def __init__(self):
        self.client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-12-01-preview"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        )
        self.deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o")

    def extract_fields(self, ocr_text: str, doc_type: str) -> list:
        """
        Uses Azure OpenAI to extract structured fields from OCR text.
        Returns a list of ExtractedField dicts matching the frontend interface.
        """
        field_names = FIELD_SCHEMAS.get(doc_type, FIELD_SCHEMAS["manufacturing-license"])

        # Truncate text to fit context window (keep first 12000 chars)
        truncated_text = ocr_text[:12000]

        system_prompt = """You are a pharmaceutical document analysis expert. 
Extract the requested fields from the OCR text of a document.
Return ONLY valid JSON array. Each item must have:
- "fieldName": exact field name as requested
- "extractedValue": the value found in the text (or "Not Found" if missing)
- "confidence": your confidence 0-100 that the extraction is correct
- "page": estimated page number (1 if unsure)

Special Rules:
1. COPP / WHO GMP Documents: The "Importing Country" is mandatory. If you cannot find a specific country name in the text (like 'Vietnam', 'Thailand', etc.), set "extractedValue" to "India".
2. MMC Documents (Handwriting & Ticks): 
   - These documents often contain handwritten notes and pen markers.
   - Look for handwritten drug codes (e.g., "Drug Code: D409" written in blue/black ink) appearing next to printed product names.
   - Pay attention to hand-drawn "ticks" or "checkmarks" made with a pen or marker. If a row is ticked, prioritize that entry or explicitly note the tick in the extracted value if relevant.
   - Extract ALL drug name and drug code pairs found, whether they are printed or handwritten. 
   - Return them as multiple items: "Product Name #1", "Drug Code #1", "Product Name #2", "Drug Code #2", etc.
3. Financial Periods: For MMC, explicitly look for 3 separate financial years.
4. Quality: Identify handwritten text vs printed text. If a value is handwritten, you can optionally append "(Handwritten)" to the extractedValue.
5. Be precise. For addresses, include full address. For license numbers, include the complete number.
6. Do NOT include any markdown formatting or code blocks. Return raw JSON only."""

        user_prompt = f"""Document Type: {doc_type}

Fields to extract:
{json.dumps(field_names, indent=2)}

OCR Text:
{truncated_text}"""

        try:
            response = self.client.chat.completions.create(
                model=self.deployment,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.1,
                max_tokens=2000,
            )

            raw = response.choices[0].message.content.strip()
            # Clean markdown wrappers if present
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
                if raw.endswith("```"):
                    raw = raw[:-3]
                raw = raw.strip()

            fields = json.loads(raw)

            # Normalize to match frontend interface
            result = []
            for f in fields:
                field_name = f.get("fieldName", "Unknown")
                value = f.get("extractedValue", "Not Found")
                
                # Rule: defaulting Importing Country to India for COPP
                if doc_type == "copp-whogmp" and "Importing Country" in field_name:
                    if value == "Not Found" or not value or value.lower() in ["none", "n/a", "null"]:
                        value = "India"

                result.append({
                    "id": "",  # Will be assigned by main.py
                    "fieldName": field_name,
                    "extractedValue": value,
                    "confidence": float(f.get("confidence", 80)),
                    "verified": False,  # Always unchecked by default
                    "page": int(f.get("page", 1)),
                })

            return result

        except Exception as e:
            print(f"  [FAIL] LLM extraction error: {str(e)[:200]}", flush=True)
            # Return empty fields with "Not Found"
            return [
                {
                    "id": "",
                    "fieldName": name,
                    "extractedValue": "Extraction Failed",
                    "confidence": 0,
                    "verified": False,
                    "page": 1,
                }
                for name in field_names
            ]
