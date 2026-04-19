import companySeal from "@/assets/company-seal.png";
import govtSeal from "@/assets/govt-seal.png";

export interface ExtractedField {
  id: string;
  fieldName: string;
  extractedValue: string;
  confidence: number;
  verified: boolean;
  page: number;
  sealImage?: string;
}

export interface DocumentData {
  id: string;
  fileName: string;
  docType: DocType;
  totalPages: number;
  uploadedAt: string;
  fields: ExtractedField[];
}

export type DocType =
  | "manufacturing-license"
  | "copp-whogmp"
  | "mmc"
  | "tender-fee-emd-proof"
  | "emd-exemption-cert";

export interface EvaluationSummary {
  "S.No.": string;
  Particular: string;
  Submitted: string;
  "As Per Requirement": string;
  Remark: string;
}

export interface ZipUploadData {
  jobId?: string;
  zipName: string;
  documents: DocumentData[];
  evaluationSummary?: EvaluationSummary[];
}

// Default 26-point checklist used when backend does not provide an evaluationSummary.
// Mirrors the Python CRITERIA in backend/comprehensive_evaluator.py.
export const DEFAULT_EVALUATION_SUMMARY: EvaluationSummary[] = [
  { "S.No.": "1", Particular: "Proof of Tender fees and EMD paid ", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "2", Particular: "Copy of EMD exemption certificate if applicable. ", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "3", Particular: "Attested photocopy of valid manufacturing drug license with product list duly approved by the central licensing authority/ state licencing authority for each and every product quoted as per technical specification in the bid. In case of importers, a valid licence of import and sale (in Form 10 with Form 41) shall be submitted. The license must have been duly renewed up to date and the quoted items along with drug code in the tender shall be clearly highlighted in the license. If quoted item is manufactured at different places, Manufacturing License & Performance certificate from all such places from respective Licensing Authority/State Drug Authority should be enclosed. For the purpose of this tender, it is hereby clarified that a Bidder could be a Loan Licensee for manufacturing drugs. Where the bidder participates as a Loan Licensee, submission of a valid certificate issued by the Principal Manufacturer shall be mandatory.", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "4", Particular: "Valid World Health Organization-Good Manufacturing Practice (WHO-GMP) certificate or COPP highlighting the quoted products for importer.", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "5", Particular: "Copy of permission from DCGI for 'New drug & Fixed Dose Combination'.", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "6", Particular: "Market Standing Certificate issued by the Licensing Authority as a Manufacturer for each drug quoted for the last 3 year (i.e., for financial year 2022-23 and 2023-24 and 2024-25 and Certificate obtained specifically for CGMSC tender / it should be in General) should be uploaded with list of drugs. In case of direct importer, evidence of import of the said drugs for the last 3 years such as bill of landing, bill of entry for last 3 years and certificate of analysis are to be produced (irrespective of the Importer). In case the market standing certificate is not having the drugs as per the specifications mentioned in the tender, it will not be considered for further processing.  In cases involving new drugs/ drugs out of patent period it is sufficient to possess relevant market standing certificate, as applicable. Market Standing Certificate (MSC) of Manufacturing unit of Loan Licensee for 3 years is needed. \nNote: Document should be uploaded in colour scan copy of either original or Notarized copy.", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "7", Particular: "Appendix-B (Checklist)", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "8", Particular: "Annexure-1 (Technical Specifications and Compliance)", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "9", Particular: "Annexure-2 (Letter Comprising Technical Bid)", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "10", Particular: "Annexure-3 (Proforma for Production and Sale Statement) ", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "11", Particular: "Annexure-4 (Details of Manufacturing Unit)", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "12", Particular: "Annexure-5 (Details of Items Quoted with Drug Code)", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "13", Particular: "Annexure-6 (Annual Turnover Statement for drug related business for three (3) Years) along with Copies of Balance Sheet and Profit and Loss Accounts for last three years i.e., (2022-23, 2023-24, 2024-25) certified by the Statutory Auditor or Chartered Accountant. ", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "14", Particular: "GST Registration certificate along with copy of the GST return not older than 3 months from the bid opening date.", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "15", Particular: "Annexure-7 (Format of Power of Attorney for signing of Bid) except for proprietorship.", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "16", Particular: "Annexure-8 (Affidavit for Blacklisting)", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "17", Particular: "Annexure-9 (Non-Conviction certificate)", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "18", Particular: "Annexure-10 (Mandate Form)", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "19", Particular: "Incorporation / Registration Certificate of Bidder", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "20", Particular: "Annexure- 12 (Bank Guarantee format for EMD), if applicable", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "21", Particular: "Annexure-13 (Pre-Contract Integrity Pact)", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "22", Particular: "Annexure -14 (Details of Drugs and Licenses)", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "23", Particular: "Authorization letter nominating a responsible person of the Bidder to attend the meetings like pre-bid & negotiation meeting. ", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "24", Particular: "The bidder has to submit benchmark Purchase Order (PO)/Rate Reference/Recent Purchase Order in support of quoted items at the time of bid submission.", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "25", Particular: "Vendor registration certificate(optional) -Vendors may apply for registration on the CGMSC portal; however, registration is not mandatory for participation in this tender.", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
  { "S.No.": "26", Particular: "Bid & bidder information (Download and extract Zip file from Tender Attachment)", Submitted: "Not evaluated.", "As Per Requirement": "Pending", Remark: "-" },
];

const DOC_TYPE_LABELS: Record<DocType, string> = {
  "manufacturing-license": "Manufacturing License",
  "copp-whogmp": "COPP / WHO GMP Certificate",
  "mmc": "MMC / Market Standing Certificate",
  "tender-fee-emd-proof": "Proof of Tender Fees and EMD",
  "emd-exemption-cert": "EMD Exemption Certificate",
};

export const getDocTypeLabel = (type: DocType) => DOC_TYPE_LABELS[type] || type;

const API_BASE = "http://localhost:8000";

export interface LogEntry {
  message: string;
  step: string;
  progress: number;
}

/**
 * Uploads a file to the backend SSE streaming endpoint.
 * Receives real-time processing logs and a final result.
 */
export const processZipFile = async (
  file: File,
  onProgress?: (pct: number, stage: string) => void,
  onLog?: (log: LogEntry) => void,
): Promise<ZipUploadData> => {
  const formData = new FormData();
  formData.append("file", file);

  onProgress?.(3, "Connecting to server...");

  const response = await fetch(`${API_BASE}/api/process-stream`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult: ZipUploadData | null = null;

  while (true) {
    const { done, value } = await reader.read();

    // Decode chunk (or flush decoder when stream is done)
    if (value) {
      buffer += decoder.decode(value, { stream: true });
    }
    if (done) {
      // Flush any remaining bytes held in the TextDecoder
      buffer += decoder.decode();
    }

    // Parse SSE events from buffer
    const events = buffer.split("\n\n");
    buffer = events.pop() || ""; // Keep incomplete event in buffer

    const parseEvents = (eventList: string[]) => {
      for (const eventStr of eventList) {
        if (!eventStr.trim()) continue;

        const lines = eventStr.split("\n");
        let eventType = "";
        let eventData = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) eventType = line.slice(7).trim();
          if (line.startsWith("data: ")) eventData = line.slice(6).trim();
        }

        if (!eventType || !eventData) continue;

        try {
          const parsed = JSON.parse(eventData);

          if (eventType === "log") {
            const log = parsed as LogEntry;
            onProgress?.(log.progress, log.message);
            onLog?.(log);
          } else if (eventType === "result") {
            finalResult = parsed as ZipUploadData;
          }
        } catch {
          // Skip parse errors
        }
      }
    };

    parseEvents(events);

    if (done) {
      // Process anything left in the buffer after stream closes
      if (buffer.trim()) {
        parseEvents([buffer]);
      }
      break;
    }
  }

  if (!finalResult) {
    throw new Error("No result received from server");
  }

  return finalResult;
};

export const exportEvaluationToExcel = async (jobId: string) => {
  const url = `${API_BASE}/api/export-evaluation/${jobId}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Export failed");

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  const contentDisposition = response.headers.get("content-disposition") || "";
  const headerFileNameMatch =
    contentDisposition.match(/filename\*=UTF-8''([^;]+)/i) ||
    contentDisposition.match(/filename="?([^"]+)"?/i);
  const decodedHeaderFileName = headerFileNameMatch?.[1]
    ? decodeURIComponent(headerFileNameMatch[1])
    : "";
  const fallbackFileName = `Tender_Evaluation_${jobId}.xlsx`;
  link.href = downloadUrl;
  link.setAttribute("download", decodedHeaderFileName || fallbackFileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

export const exportEvaluationToExcelDirect = async (firmName: string, evaluationSummary: EvaluationSummary[]) => {
  const url = `${API_BASE}/api/export-evaluation`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firm_name: firmName,
      evaluation_summary: evaluationSummary,
    }),
  });
  if (!response.ok) throw new Error("Export failed");

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  const contentDisposition = response.headers.get("content-disposition") || "";
  const headerFileNameMatch =
    contentDisposition.match(/filename\*=UTF-8''([^;]+)/i) ||
    contentDisposition.match(/filename="?([^"]+)"?/i);
  const decodedHeaderFileName = headerFileNameMatch?.[1]
    ? decodeURIComponent(headerFileNameMatch[1])
    : "";
  const normalizedFirmName = (firmName || "Firm-Name")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .trim()
    .replace(/\s+/g, "_");
  const fallbackFileName = `Tender_Evaluation_${normalizedFirmName || "Firm-Name"}.xlsx`;
  link.href = downloadUrl;
  link.setAttribute("download", decodedHeaderFileName || fallbackFileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

// Keep mock generators for offline/demo fallback
export const generateZipData = (zipName: string): ZipUploadData => {
  const docFiles = [
    "Manufacturing_License_2024.pdf",
    "COPP_WHOGMP_Certificate.pdf",
    "MMC_Market_Standing_Report.pdf",
    "ProofoftenderfeesandEMD.pdf",
    "EMDexemptioncert.pdf",
  ];

  return {
    zipName,
    documents: docFiles.map((fileName, i) => {
      const docType = detectDocType(fileName);
      return {
        id: `doc-${i + 1}`,
        fileName,
        docType,
        totalPages: TOTAL_PAGES[docType],
        uploadedAt: new Date().toISOString(),
        fields: FIELD_GENERATORS[docType](),
      };
    }),
  };
};

const detectDocType = (fileName: string): DocType => {
  const lower = fileName.toLowerCase();
  const normalized = lower.replace(/[^a-z0-9]+/g, "");
  if (normalized.includes("proofoftenderfeesandemd")) return "tender-fee-emd-proof";
  if (normalized.includes("emdexemptioncert")) return "emd-exemption-cert";
  if (lower.includes("copp") || lower.includes("whogmp") || lower.includes("gmp")) return "copp-whogmp";
  if (lower.includes("mmc") || lower.includes("market")) return "mmc";
  return "manufacturing-license";
};

const generateManufacturingLicenseFields = (): ExtractedField[] => [
  { id: "ml-1", fieldName: "Company Name", extractedValue: "Pharma Industries Pvt. Ltd.", confidence: 97.2, verified: true, page: 1 },
  { id: "ml-2", fieldName: "Company Address", extractedValue: "Plot No. 45, Industrial Area Phase-II, Sector 62, Noida, UP - 201309", confidence: 91.5, verified: true, page: 1 },
  { id: "ml-7", fieldName: "Seal of Company", extractedValue: "Detected — Pharma Industries Pvt. Ltd. (Round Seal)", confidence: 85.4, verified: false, page: 12, sealImage: companySeal },
  { id: "ml-8", fieldName: "Sign & Seal of Authority", extractedValue: "Detected — Govt. of India, CDSCO (Official Seal)", confidence: 82.9, verified: false, page: 12, sealImage: govtSeal },
];

const generateCOPPFields = (): ExtractedField[] => [
  { id: "cp-1", fieldName: "Company Name", extractedValue: "Pharma Industries Pvt. Ltd.", confidence: 96.8, verified: true, page: 1 },
  { id: "cp-5", fieldName: "Seal of Company", extractedValue: "Detected — Pharma Industries Pvt. Ltd. (Round Seal)", confidence: 86.2, verified: false, page: 8, sealImage: companySeal },
];

const generateMMCFields = (): ExtractedField[] => [
  { id: "mm-1", fieldName: "Company Name", extractedValue: "Pharma Industries Pvt. Ltd.", confidence: 97.9, verified: true, page: 1 },
  { id: "mm-9", fieldName: "Seal of Company", extractedValue: "Detected — Pharma Industries Pvt. Ltd. (Round Seal)", confidence: 84.7, verified: false, page: 10, sealImage: companySeal },
];

const generateTenderFeeEmdFields = (): ExtractedField[] => [
  { id: "tf-1", fieldName: "Tender Fee Paid Online (Yes/No)", extractedValue: "Yes", confidence: 93.1, verified: true, page: 1 },
  { id: "tf-2", fieldName: "EMD Paid Online (Yes/No)", extractedValue: "Yes", confidence: 93.8, verified: true, page: 1 },
  { id: "tf-3", fieldName: "Submitted EMD Amount", extractedValue: "INR 500000", confidence: 91.6, verified: true, page: 1 },
  { id: "tf-4", fieldName: "UTR Number", extractedValue: "UTR1234567890", confidence: 90.4, verified: true, page: 1 },
  { id: "tf-5", fieldName: "Address", extractedValue: "Plot 1, Industrial Area, Jaipur, Rajasthan", confidence: 87.2, verified: true, page: 1 },
];

const generateEmdExemptionFields = (): ExtractedField[] => [
  { id: "ee-1", fieldName: "EMD Exemption Applicable (Yes/No)", extractedValue: "No", confidence: 92.4, verified: true, page: 1 },
  { id: "ee-2", fieldName: "Certificate Not Applicable Statement (Yes/No)", extractedValue: "Yes", confidence: 91.3, verified: true, page: 1 },
  { id: "ee-3", fieldName: "Subject", extractedValue: "EMD Exemption Certificate", confidence: 88.5, verified: true, page: 1 },
  { id: "ee-4", fieldName: "Tender Reference Number", extractedValue: "232/CGMSCL/Drug&Medicine/2025-26", confidence: 89.0, verified: true, page: 1 },
  { id: "ee-5", fieldName: "Address", extractedValue: "Jaipur, Rajasthan", confidence: 86.9, verified: true, page: 1 },
];

const FIELD_GENERATORS: Record<DocType, () => ExtractedField[]> = {
  "manufacturing-license": generateManufacturingLicenseFields,
  "copp-whogmp": generateCOPPFields,
  "mmc": generateMMCFields,
  "tender-fee-emd-proof": generateTenderFeeEmdFields,
  "emd-exemption-cert": generateEmdExemptionFields,
};

const TOTAL_PAGES: Record<DocType, number> = {
  "manufacturing-license": 40,
  "copp-whogmp": 18,
  "mmc": 24,
  "tender-fee-emd-proof": 2,
  "emd-exemption-cert": 2,
};
