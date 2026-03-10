import { motion } from "framer-motion";
import { Check, X, ZoomIn } from "lucide-react";
import { useState } from "react";
import type { ExtractedField } from "@/lib/mockData";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface VerificationTableProps {
  fields: ExtractedField[];
  onToggleVerify: (id: string) => void;
}

const getConfidenceColor = (score: number) => {
  if (score >= 90) return "text-confidence-high bg-success/10";
  if (score >= 80) return "text-confidence-medium bg-warning/10";
  return "text-confidence-low bg-destructive/10";
};

const getConfidenceBadge = (score: number) => {
  if (score >= 90) return "High";
  if (score >= 80) return "Medium";
  return "Low";
};

const VerificationTable = ({ fields, onToggleVerify }: VerificationTableProps) => {
  const [previewSeal, setPreviewSeal] = useState<string | null>(null);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full overflow-hidden rounded-2xl bg-card shadow-card"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Field</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Extracted Value</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Page</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">OCR Confidence</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">System</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Human Verify</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, i) => (
                <motion.tr
                  key={field.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                >
                  <td className="px-5 py-4 text-sm font-medium text-foreground whitespace-nowrap">
                    {field.fieldName}
                  </td>
                  <td className="px-5 py-4 text-sm text-foreground max-w-md">
                    {field.sealImage ? (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setPreviewSeal(field.sealImage!)}
                          className="relative group flex-shrink-0 w-12 h-12 rounded-lg bg-secondary/50 border border-border overflow-hidden hover:border-primary/50 transition-colors"
                        >
                          <img src={field.sealImage} alt={field.fieldName} className="w-full h-full object-contain p-1" />
                          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
                            <ZoomIn className="w-3.5 h-3.5 text-foreground opacity-0 group-hover:opacity-70 transition-opacity" />
                          </div>
                        </button>
                        <span className="font-mono text-xs break-words whitespace-normal">{field.extractedValue}</span>
                      </div>
                    ) : (
                      <span className="font-mono text-xs break-words whitespace-normal block">{field.extractedValue}</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-xs font-mono text-muted-foreground">p.{field.page}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-mono ${getConfidenceColor(field.confidence)}`}>
                      {field.confidence.toFixed(1)}%
                      <span className="text-[10px] font-normal opacity-70">{getConfidenceBadge(field.confidence)}</span>
                    </span>
                  </td>
                  {/* System Verification: auto-tick if confidence >= 70 */}
                  <td className="px-5 py-4 text-center">
                    {field.confidence >= 70 ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-success/10">
                        <Check className="w-4 h-4 text-success" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-destructive/10">
                        <X className="w-4 h-4 text-destructive" />
                      </span>
                    )}
                  </td>
                  {/* Human Verification: togglable, ticked by default */}
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => onToggleVerify(field.id)}
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${field.verified
                          ? "bg-success text-success-foreground shadow-sm"
                          : "bg-secondary text-muted-foreground hover:bg-success/20 hover:text-success"
                        }`}
                    >
                      {field.verified ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <Dialog open={!!previewSeal} onOpenChange={() => setPreviewSeal(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogTitle className="text-sm font-semibold">Seal Preview</DialogTitle>
          {previewSeal && (
            <div className="flex items-center justify-center p-4">
              <img src={previewSeal} alt="Seal preview" className="max-w-full max-h-96 object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VerificationTable;
