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

export type DocType = "manufacturing-license" | "copp-whogmp" | "mmc";

export interface ZipUploadData {
  zipName: string;
  documents: DocumentData[];
}

const DOC_TYPE_LABELS: Record<DocType, string> = {
  "manufacturing-license": "Manufacturing License",
  "copp-whogmp": "COPP / WHO GMP Certificate",
  "mmc": "MMC / Market Standing Certificate",
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
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse SSE events from buffer
    const events = buffer.split("\n\n");
    buffer = events.pop() || ""; // Keep incomplete event in buffer

    for (const eventStr of events) {
      if (!eventStr.trim()) continue;

      const lines = eventStr.split("\n");
      let eventType = "";
      let eventData = "";

      for (const line of lines) {
        if (line.startsWith("event: ")) eventType = line.slice(7);
        if (line.startsWith("data: ")) eventData = line.slice(6);
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
  }

  if (!finalResult) {
    throw new Error("No result received from server");
  }

  return finalResult;
};

// Keep mock generators for offline/demo fallback
export const generateZipData = (zipName: string): ZipUploadData => {
  const docFiles = [
    "Manufacturing_License_2024.pdf",
    "COPP_WHOGMP_Certificate.pdf",
    "MMC_Market_Standing_Report.pdf",
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

const FIELD_GENERATORS: Record<DocType, () => ExtractedField[]> = {
  "manufacturing-license": generateManufacturingLicenseFields,
  "copp-whogmp": generateCOPPFields,
  "mmc": generateMMCFields,
};

const TOTAL_PAGES: Record<DocType, number> = {
  "manufacturing-license": 40,
  "copp-whogmp": 18,
  "mmc": 24,
};
