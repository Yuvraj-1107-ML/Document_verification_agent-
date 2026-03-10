import { useCallback, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileArchive, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { processZipFile, type ZipUploadData, type LogEntry } from "@/lib/mockData";

interface DocumentUploadProps {
  onUploadComplete: (data: ZipUploadData) => void;
}

const DocumentUpload = ({ onUploadComplete }: DocumentUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageName, setStageName] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setIsProcessing(true);
      setProgress(3);
      setStageName("Connecting to server...");
      setError("");
      setLogs([]);

      try {
        const data = await processZipFile(
          file,
          (pct, stage) => {
            setProgress(pct);
            setStageName(stage);
          },
          (log) => {
            setLogs((prev) => [...prev, log]);
          }
        );
        setProgress(100);
        setStageName("Complete!");
        setTimeout(() => onUploadComplete(data), 600);
      } catch (err: any) {
        console.error("Upload failed:", err);
        setError(err.message || "Processing failed. Is the backend running?");
        setIsProcessing(false);
        setProgress(0);
      }
    },
    [onUploadComplete]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const getLogIcon = (step: string) => {
    if (step === "complete" || step.endsWith("_done") || step === "doc_done") {
      return <CheckCircle2 className="w-3 h-3 text-success flex-shrink-0 mt-0.5" />;
    }
    if (step.includes("fail") || step.includes("error")) {
      return <AlertCircle className="w-3 h-3 text-destructive flex-shrink-0 mt-0.5" />;
    }
    return <Loader2 className="w-3 h-3 text-primary animate-spin flex-shrink-0 mt-0.5" />;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!isProcessing ? (
          <motion.label
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            htmlFor="file-upload"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`relative flex flex-col items-center justify-center w-full h-64 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${isDragging ? "border-primary bg-accent shadow-glow" : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
              }`}
          >
            <input id="file-upload" type="file" accept=".zip,.pdf,.jpg,.jpeg,.png,.bmp,.tiff,.tif,.webp" className="hidden" onChange={onFileSelect} />
            <motion.div animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300 }}>
              <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-primary-foreground" />
              </div>
            </motion.div>
            <p className="text-lg font-semibold text-foreground mb-1">Drop your file here</p>
            <p className="text-sm text-muted-foreground">Supports ZIP, PDF, or Image files. Document type is auto-detected.</p>
            {error && (
              <p className="text-sm text-destructive mt-3 bg-destructive/10 px-4 py-2 rounded-lg">{error}</p>
            )}
          </motion.label>
        ) : (
          <motion.div key="processing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col w-full rounded-2xl bg-card shadow-card p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <FileArchive className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground truncate max-w-xs">{fileName}</span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span className="truncate max-w-[80%]">{stageName || "Processing..."}</span>
                <span className="font-mono">{Math.min(Math.round(progress), 100)}%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full gradient-brand rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ ease: "easeOut", duration: 0.3 }}
                />
              </div>
            </div>

            {/* Live Log Console */}
            <div
              ref={logContainerRef}
              className="bg-secondary/60 rounded-xl p-3 max-h-56 overflow-y-auto space-y-1.5 font-mono text-[11px] border border-border/50"
            >
              {logs.length === 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Waiting for server response...</span>
                </div>
              )}
              {logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-start gap-2"
                >
                  {getLogIcon(log.step)}
                  <span className={`leading-relaxed ${log.step === "complete" ? "text-success font-semibold" :
                      log.step.includes("fail") ? "text-destructive" :
                        log.message.startsWith("  ") ? "text-muted-foreground" :
                          "text-foreground"
                    }`}>
                    {log.message}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DocumentUpload;
