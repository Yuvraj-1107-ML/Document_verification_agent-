import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, FileArchive, ShieldCheck } from "lucide-react";
import DocumentUpload from "@/components/DocumentUpload";
import VerificationTable from "@/components/VerificationTable";
import ReportSummary from "@/components/ReportSummary";
import { getDocTypeLabel, type ZipUploadData } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const logoImg = "/logo-01 (1).jpg";

const Index = () => {
  const [zipData, setZipData] = useState<ZipUploadData | null>(null);
  const [activeDocId, setActiveDocId] = useState<string>("");

  const handleUploadComplete = useCallback((data: ZipUploadData) => {
    // Set human verification to true by default for all fields
    const dataWithVerified: ZipUploadData = {
      ...data,
      documents: data.documents.map((doc) => ({
        ...doc,
        fields: doc.fields.map((f) => ({ ...f, verified: true })),
      })),
    };
    setZipData(dataWithVerified);
    setActiveDocId(dataWithVerified.documents[0]?.id || "");
  }, []);

  const handleToggleVerify = useCallback((fieldId: string) => {
    setZipData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        documents: prev.documents.map((doc) => ({
          ...doc,
          fields: doc.fields.map((f) =>
            f.id === fieldId ? { ...f, verified: !f.verified } : f
          ),
        })),
      };
    });
  }, []);

  const handleReset = () => {
    setZipData(null);
    setActiveDocId("");
  };

  const activeDoc = zipData?.documents.find((d) => d.id === activeDocId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Professional Header */}
      <header className="border-b border-border/60 bg-card/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight leading-tight">DocVerify AI</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">Intelligent Document Verification</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {zipData && (
              <Button variant="outline" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-foreground border-border/60 rounded-lg gap-1.5 text-xs">
                <RotateCcw className="w-3.5 h-3.5" />
                New Upload
              </Button>
            )}
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-success/10 text-success px-2.5 py-1 rounded-full font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secured
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!zipData ? (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center pt-16">
              <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-foreground mb-2 tracking-tight text-center">
                Upload Document ZIP for Verification
              </motion.h2>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-muted-foreground mb-10 text-center max-w-lg">
                Upload a ZIP containing Manufacturing License, COPP/WHO GMP, and MMC documents. Our AI extracts and verifies all key fields per document type.
              </motion.p>
              <DocumentUpload onUploadComplete={handleUploadComplete} />
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <FileArchive className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg">{zipData.zipName}</span>
                <span className="text-xs text-muted-foreground">· {zipData.documents.length} documents detected</span>
              </div>

              <Tabs value={activeDocId} onValueChange={setActiveDocId} className="w-full">
                <TabsList className="w-full justify-start bg-secondary/50 rounded-xl p-1 h-auto flex-wrap">
                  {zipData.documents.map((doc) => (
                    <TabsTrigger key={doc.id} value={doc.id} className="rounded-lg text-xs px-4 py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                      {getDocTypeLabel(doc.docType)}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {zipData.documents.map((doc) => (
                  <TabsContent key={doc.id} value={doc.id} className="space-y-6 mt-4">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono bg-secondary px-2 py-0.5 rounded">{doc.fileName}</span>
                      <span>· {doc.totalPages} pages</span>
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-[10px] uppercase tracking-wider">
                        {getDocTypeLabel(doc.docType)}
                      </span>
                    </div>

                    <section>
                      <h2 className="text-lg font-bold text-foreground mb-3">Extracted Fields & Verification</h2>
                      <VerificationTable fields={doc.fields} onToggleVerify={handleToggleVerify} />
                    </section>

                    <section>
                      <h2 className="text-lg font-bold text-foreground mb-3">Report & Summary</h2>
                      <ReportSummary data={doc} />
                    </section>
                  </TabsContent>
                ))}
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Professional Footer */}
      <footer className="mt-auto border-t border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="AI LifeBot" className="h-6 w-auto object-contain opacity-70" />
            <span className="text-[11px] text-muted-foreground">Built by <strong className="text-foreground/70">AI LifeBot</strong></span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} AI LifeBot™ — Intelligent Document Verification System
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
