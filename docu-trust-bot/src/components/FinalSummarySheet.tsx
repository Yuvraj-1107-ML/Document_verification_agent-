import { FileArchive, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EvaluationSummary } from "@/lib/mockData";

type FinalSummarySheetProps = {
  tenderRefText: string;
  coverText: string;
  firmNameText: string;
  rows: EvaluationSummary[];
  jobId?: string;
  onDownloadExcel?: () => void;
};

const FinalSummarySheet = ({
  tenderRefText,
  coverText,
  firmNameText,
  rows,
  jobId,
  onDownloadExcel,
}: FinalSummarySheetProps) => {
  const canDownloadExcel = !!jobId || rows.length > 0;
  const handleDownloadClick = () => {
    if (!canDownloadExcel) {
      window.alert(
        "Nothing to export yet.\n\nPlease run an upload and wait until the Final Summary table has rows, then try again."
      );
      return;
    }
    onDownloadExcel?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Final Summary</h2>
        </div>
        <Button
          onClick={handleDownloadClick}
          className="gradient-brand text-primary-foreground font-medium rounded-xl"
        >
          <FileArchive className="w-4 h-4 mr-2" />
          Download Excel
        </Button>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border/60">
                <th colSpan={5} className="px-4 py-2 text-xs font-semibold text-foreground">
                  {tenderRefText}
                </th>
              </tr>
              <tr className="border-b border-border/60">
                <th colSpan={5} className="px-4 py-2 text-xs font-semibold text-foreground">
                  {coverText}
                </th>
              </tr>
              <tr className="border-b border-border/60">
                <th colSpan={5} className="px-4 py-2 text-xs font-semibold text-foreground">
                  {firmNameText}
                </th>
              </tr>
              <tr className="bg-secondary/40 text-[10px] uppercase font-bold text-muted-foreground tracking-wider border-b border-border/60">
                <th className="px-4 py-3 w-[70px] border-r border-border/40">S.No.</th>
                <th className="px-4 py-3 min-w-[320px] border-r border-border/40">Particular</th>
                <th className="px-4 py-3 min-w-[320px] border-r border-border/40">Submitted</th>
                <th className="px-4 py-3 w-[150px] border-r border-border/40">As Per Requirement</th>
                <th className="px-4 py-3 min-w-[180px]">Remark</th>
              </tr>
            </thead>

            <tbody className="text-xs">
              {rows.map((row, idx) => (
                <tr key={`${row["S.No."]}-${idx}`} className="border-b border-border/40">
                  <td className="px-4 py-2 font-mono text-muted-foreground border-r border-border/30 align-top whitespace-nowrap">
                    {row["S.No."]}
                  </td>
                  <td className="px-4 py-2 font-medium text-foreground border-r border-border/30 align-top">
                    {row.Particular}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground border-r border-border/30 align-top whitespace-pre-wrap leading-relaxed">
                    {row.Submitted}
                  </td>
                  <td className="px-4 py-2 border-r border-border/30 align-top">
                    <span
                      className={[
                        "inline-flex items-center px-2 py-1 rounded w-fit font-medium",
                        row["As Per Requirement"] === "Yes"
                          ? "bg-success/15 text-success"
                          : row["As Per Requirement"] === "No"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-warning/15 text-warning",
                      ].join(" ")}
                    >
                      {row["As Per Requirement"]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground align-top">{row.Remark}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No evaluation summary available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!canDownloadExcel && (
        <div className="text-xs text-muted-foreground">
          Excel download is not ready yet (no rows to export).
        </div>
      )}
    </div>
  );
};

export default FinalSummarySheet;

