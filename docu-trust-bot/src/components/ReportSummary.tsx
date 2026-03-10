import { motion } from "framer-motion";
import { FileDown, FileText, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import * as XLSX from "xlsx";
import type { DocumentData } from "@/lib/mockData";
import { getDocTypeLabel } from "@/lib/mockData";
import { Button } from "@/components/ui/button";

interface ReportSummaryProps {
  data: DocumentData;
}

const ReportSummary = ({ data }: ReportSummaryProps) => {
  const totalFields = data.fields.length;
  const verifiedCount = data.fields.filter((f) => f.verified).length;
  const avgConfidence = data.fields.reduce((sum, f) => sum + f.confidence, 0) / totalFields;
  const lowConfidence = data.fields.filter((f) => f.confidence < 85);
  const sealFields = data.fields.filter((f) => f.sealImage);

  const downloadExcel = () => {
    const wsData = data.fields.map((f) => ({
      "Field Name": f.fieldName,
      "Extracted Value": f.extractedValue,
      Page: f.page,
      "OCR Confidence (%)": f.confidence,
      "System Verified": f.confidence >= 90 ? "Yes" : "No",
      "Human Verified": f.verified ? "Yes" : "No",
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Verification Report");

    const summaryData = [
      { Metric: "Document", Value: data.fileName },
      { Metric: "Document Type", Value: getDocTypeLabel(data.docType) },
      { Metric: "Total Pages", Value: data.totalPages },
      { Metric: "Fields Extracted", Value: totalFields },
      { Metric: "Verified Fields", Value: `${verifiedCount}/${totalFields}` },
      { Metric: "Average Confidence", Value: `${avgConfidence.toFixed(1)}%` },
      { Metric: "Seals Detected", Value: sealFields.length },
      { Metric: "Report Generated", Value: new Date().toLocaleString() },
    ];
    const ws2 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws2, "Summary");

    XLSX.writeFile(wb, `${data.docType}-report-${Date.now()}.xlsx`);
  };

  const downloadReport = () => {
    const report = `
DOCUMENT VERIFICATION REPORT
=============================
File: ${data.fileName}
Type: ${getDocTypeLabel(data.docType)}
Pages: ${data.totalPages}
Generated: ${new Date().toLocaleString()}

SUMMARY
-------
Fields Extracted: ${totalFields}
Fields Verified: ${verifiedCount}/${totalFields}
Average OCR Confidence: ${avgConfidence.toFixed(1)}%
Seals Detected: ${sealFields.length}

EXTRACTED FIELDS
----------------
${data.fields
        .map(
          (f) =>
            `${f.fieldName}: ${f.extractedValue}
   Confidence: ${f.confidence}% | Page: ${f.page} | Verified: ${f.verified ? "Yes" : "No"}`
        )
        .join("\n\n")}

${lowConfidence.length > 0 ? `\nATTENTION REQUIRED\n------------------\n${lowConfidence.map((f) => `- ${f.fieldName} (${f.confidence}%) needs manual review`).join("\n")}` : ""}

STATUS: ${verifiedCount === totalFields ? "FULLY VERIFIED" : "PENDING HUMAN REVIEW"}
    `.trim();

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.docType}-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: FileText, label: "Fields Extracted", value: totalFields, color: "text-primary" },
          { icon: CheckCircle2, label: "Verified", value: `${verifiedCount}/${totalFields}`, color: "text-success" },
          { icon: AlertTriangle, label: "Needs Review", value: lowConfidence.length, color: "text-warning" },
          { icon: Clock, label: "Avg. Confidence", value: `${avgConfidence.toFixed(1)}%`, color: "text-primary" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-card shadow-card p-4 flex flex-col gap-1">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-2xl font-bold text-foreground font-mono">{stat.value}</span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-card shadow-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Verification Summary</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Document <strong className="text-foreground">{data.fileName}</strong> ({getDocTypeLabel(data.docType)}, {data.totalPages} pages) has been processed.{" "}
          <strong className="text-foreground">{totalFields} fields</strong> extracted with avg confidence of{" "}
          <strong className="text-foreground">{avgConfidence.toFixed(1)}%</strong>.{" "}
          {verifiedCount === totalFields ? (
            <span className="text-success font-medium">All fields verified.</span>
          ) : (
            <span className="text-warning font-medium">{totalFields - verifiedCount} field(s) require human verification.</span>
          )}{" "}
          {sealFields.length} seal(s) detected in this document.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={downloadReport} className="gradient-brand text-primary-foreground hover:opacity-90 transition-opacity rounded-xl px-5">
          <FileText className="w-4 h-4 mr-2" />
          Download Report
        </Button>
        <Button onClick={downloadExcel} variant="outline" className="rounded-xl px-5">
          <FileDown className="w-4 h-4 mr-2" />
          Download Excel
        </Button>
      </div>
    </motion.div>
  );
};

export default ReportSummary;
