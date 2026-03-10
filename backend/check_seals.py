import json

f = open(r'e:\CGMSCL_new_requirement\ocr-poc\analysis_output\4-184703_Pfizer Limited_4COPPandGMPDruglabelProductliteratureIEC_response.json', 'r', encoding='utf-8')
d = json.load(f)
lr_list = d['result']['layoutParsingResults']

total_seals = 0
for page_idx, lr in enumerate(lr_list):
    pr = lr.get('prunedResult', {})
    blocks = pr.get('parsing_res_list', [])
    seals = [b for b in blocks if b.get('block_label') == 'seal']
    if seals:
        total_seals += len(seals)
        for s in seals:
            print(f"Page {page_idx+1}: seal bbox={s.get('block_bbox')}, content='{s.get('block_content','')[:50]}'")

print(f"\nTotal seals across all pages: {total_seals}")
