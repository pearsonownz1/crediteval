import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import EmbedPDF from "@embedpdf/snippet";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileBadge2,
  FileSearch,
  FileText,
  Languages,
  Loader2,
  RefreshCcw,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { extractPdfData, type ExtractedPdfData } from "@/lib/pdfExtraction";
import { generatePdfTranslation, type GeneratedTranslationResult } from "@/utils/pdfTranslationApi";

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

type WorkspaceStatus = "idle" | "extracting" | "translating" | "ready" | "error";

const PdfWorkspacePage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const viewerHostRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [translationText, setTranslationText] = useState("");
  const [workspaceStatus, setWorkspaceStatus] = useState<WorkspaceStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("Upload a PDF to extract text and draft a translation.");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedPdfData | null>(null);
  const [translationResult, setTranslationResult] = useState<GeneratedTranslationResult | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!uploadedFile) {
      return;
    }

    const nextUrl = URL.createObjectURL(uploadedFile);
    setFileUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [uploadedFile]);

  useEffect(() => {
    if (!viewerHostRef.current) {
      return;
    }

    const host = viewerHostRef.current;
    host.innerHTML = "";

    if (!fileUrl) {
      return;
    }

    EmbedPDF.init({
      type: "container",
      target: host,
      src: fileUrl,
    });

    return () => {
      host.innerHTML = "";
    };
  }, [fileUrl]);

  const metadata = useMemo(() => {
    if (!uploadedFile) {
      return null;
    }

    return {
      name: uploadedFile.name,
      size: formatFileSize(uploadedFile.size),
      modified: new Date(uploadedFile.lastModified).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };
  }, [uploadedFile]);

  const runTranslationPipeline = async (file: File, regenerate = false) => {
    setWorkspaceStatus("extracting");
    setErrorMessage(null);
    setStatusMessage("Extracting PDF text and rendering OCR previews…");

    try {
      const extracted = await extractPdfData(file);
      setExtractedData(extracted);

      setWorkspaceStatus("translating");
      setStatusMessage("Drafting a certified translation with OpenAI…");

      const result = await generatePdfTranslation(file, extracted, { regenerate });
      setTranslationResult(result);
      setTranslationText(result.translation);
      setWorkspaceStatus("ready");
      setStatusMessage("Translation draft generated. You can edit it before export.");

      toast({
        title: regenerate ? "Translation regenerated" : "Translation draft ready",
        description: "The right-hand panel now contains a generated editable draft.",
      });
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Failed to process this PDF.";
      setWorkspaceStatus("error");
      setErrorMessage(nextMessage);
      setStatusMessage("The translation pipeline failed before completion.");
      setTranslationResult(null);
      setTranslationText("");

      toast({
        title: "Translation failed",
        description: nextMessage,
        variant: "destructive",
      });
    }
  };

  const loadFile = async (file: File | null) => {
    if (!file) {
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast({
        title: "PDF required",
        description: "Upload a PDF file to preview and draft the translation.",
      });
      return;
    }

    setUploadedFile(file);
    setExtractedData(null);
    setTranslationResult(null);
    setTranslationText("");
    await runTranslationPipeline(file);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await loadFile(event.target.files?.[0] ?? null);
    event.target.value = "";
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    await loadFile(event.dataTransfer.files?.[0] ?? null);
  };

  const handleRegenerate = async () => {
    if (!uploadedFile) {
      return;
    }

    await runTranslationPipeline(uploadedFile, true);
  };

  const handleExportStub = () => {
    toast({
      title: "Export queued",
      description: "This route now generates the draft for real. Export is still the next piece.",
    });
  };

  const isBusy = workspaceStatus === "extracting" || workspaceStatus === "translating";

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_32%,#ffffff_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-950 px-6 py-5 text-white lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
                Certified Translation Workspace
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                PDF intake, side-by-side review, OCR, and draft translation
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                className="bg-white text-slate-950 hover:bg-slate-100"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}>
                <Upload className="mr-2 h-4 w-4" />
                Upload PDF
              </Button>
              <Button
                variant="outline"
                className="border-slate-700 bg-transparent text-white hover:bg-slate-900"
                onClick={handleRegenerate}
                disabled={!uploadedFile || isBusy}>
                {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                Regenerate Draft
              </Button>
              <Button
                variant="outline"
                className="border-slate-700 bg-transparent text-white hover:bg-slate-900"
                onClick={handleExportStub}
                disabled={!uploadedFile || isBusy}>
                <Download className="mr-2 h-4 w-4" />
                Export Draft
              </Button>
            </div>
          </div>

          <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
            <Card className="overflow-hidden border-slate-200 shadow-none">
              <CardHeader className="border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-slate-950">Source PDF</CardTitle>
                    <CardDescription>
                      Review the uploaded file with EmbedPDF while extraction and translation run.
                    </CardDescription>
                  </div>
                  {uploadedFile ? (
                    <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      {workspaceStatus === "ready" ? "Draft ready" : isBusy ? "Processing" : "Loaded"}
                    </div>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!uploadedFile ? (
                  <div
                    className={`m-6 flex min-h-[640px] cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed px-8 text-center transition ${
                      isDragging
                        ? "border-sky-500 bg-sky-50"
                        : "border-slate-300 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      setIsDragging(false);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDrop={handleDrop}>
                    <div className="mb-5 rounded-full bg-sky-100 p-4 text-sky-700">
                      <FileText className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-semibold text-slate-950">
                      Drop a PDF to start a translation workspace
                    </h2>
                    <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                      Upload a source document to open a split-screen reviewer with real text extraction and an AI-generated certified translation draft.
                    </p>
                    <Button className="mt-6">
                      <Upload className="mr-2 h-4 w-4" />
                      Choose PDF
                    </Button>
                    <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-400">
                      Drag and drop or click to browse
                    </p>
                  </div>
                ) : (
                  <div className="flex min-h-[640px] flex-col bg-slate-100">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-950">{uploadedFile.name}</p>
                        <p className="text-xs text-slate-500">{metadata?.size} · Uploaded for translation review</p>
                      </div>
                      <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                        EmbedPDF viewer
                      </div>
                    </div>
                    <div ref={viewerHostRef} className="h-[720px] w-full bg-white" />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-6">
              <Card className="border-slate-200 shadow-none">
                <CardHeader className="border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-slate-950">Certified Translation Draft</CardTitle>
                      <CardDescription>
                        Editable target text generated from extracted PDF text plus OCR-style image review.
                      </CardDescription>
                    </div>
                    <div className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      <Languages className="mr-1.5 h-3.5 w-3.5" />
                      {translationResult?.detectedSourceLanguage || "Awaiting source"} → English
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1">Certified format</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">Editable</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">Reviewer-ready</span>
                    {translationResult?.model ? <span className="rounded-full bg-slate-100 px-3 py-1">{translationResult.model}</span> : null}
                  </div>

                  {isBusy ? (
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-900">
                      <div className="flex items-center gap-3 font-medium">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {statusMessage}
                      </div>
                      <p className="mt-2 text-sky-800/80">
                        Large or scanned PDFs can take a bit longer because the app renders page previews for OCR recovery.
                      </p>
                    </div>
                  ) : null}

                  {workspaceStatus === "error" ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900">
                      <div className="flex items-center gap-2 font-medium">
                        <AlertCircle className="h-4 w-4" />
                        Translation pipeline error
                      </div>
                      <p className="mt-2">{errorMessage}</p>
                    </div>
                  ) : null}

                  <Textarea
                    value={translationText}
                    onChange={(event) => setTranslationText(event.target.value)}
                    placeholder="Translation draft will appear here after upload."
                    className="min-h-[470px] resize-none border-slate-200 bg-white font-medium leading-6 text-slate-800"
                    disabled={!uploadedFile && !translationText}
                  />

                  <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <p>Export is still a stub, but the translation draft is now generated from the uploaded PDF.</p>
                    <Button variant="outline" onClick={handleExportStub} disabled={!uploadedFile || isBusy}>
                      Export Stub
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none">
                <CardHeader className="border-b border-slate-200 bg-slate-50">
                  <CardTitle className="flex items-center text-slate-950">
                    <FileBadge2 className="mr-2 h-5 w-5 text-sky-700" />
                    File Metadata & Extraction
                  </CardTitle>
                  <CardDescription>
                    Quick intake details plus extraction diagnostics for reviewer confidence.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 p-6 text-sm text-slate-700">
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <span className="text-slate-500">Document</span>
                    <span className="max-w-[60%] truncate font-medium text-slate-950">{metadata?.name ?? "Awaiting upload"}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <span className="text-slate-500">File size</span>
                    <span className="font-medium text-slate-950">{metadata?.size ?? "Not available"}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <span className="text-slate-500">Last modified</span>
                    <span className="font-medium text-slate-950">{metadata?.modified ?? "Not available"}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <span className="text-slate-500">Pages</span>
                    <span className="font-medium text-slate-950">{extractedData?.pageCount ?? "Not available"}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <span className="text-slate-500">Extraction mode</span>
                    <span className="font-medium capitalize text-slate-950">{extractedData?.extractionMethod?.replace(/-/g, " ") ?? "Waiting"}</span>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2 font-medium text-slate-950">
                      <FileSearch className="h-4 w-4 text-sky-700" />
                      Extracted source snippet
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {translationResult?.sourceSnippet || extractedData?.textPreview || "No extracted text yet."}
                    </p>
                  </div>
                  {translationResult?.summary ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      <p className="font-medium text-slate-950">Translation summary</p>
                      <p className="mt-2">{translationResult.summary}</p>
                      {translationResult.notes.length > 0 ? (
                        <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-600">
                          {translationResult.notes.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                      ) : null}
                      {translationResult.warnings.length > 0 ? (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-amber-900">
                          <p className="font-medium">Warnings</p>
                          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                            {translationResult.warnings.map((warning) => (
                              <li key={warning}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />
    </section>
  );
};

export default PdfWorkspacePage;
