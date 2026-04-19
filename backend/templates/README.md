## Evaluation Excel templates

Place your Excel template(s) in this folder and set the environment variable `EVALUATION_TEMPLATE_PATH`
to the template you want the backend to use when generating the *Comprehensive Technical Evaluation* export.

Example (PowerShell):

```powershell
$env:EVALUATION_TEMPLATE_PATH="E:\CGMSCL_new_requirement\ocr-poc\backend\templates\Technical Evaluation Sheet Tender 232_Pradeep (1).xlsx"
```

If `EVALUATION_TEMPLATE_PATH` is not set, the backend falls back to `backend/Comprehensive_Evaluation_Pfizer.xlsx`.

