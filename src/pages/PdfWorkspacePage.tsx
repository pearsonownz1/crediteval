import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import EmbedPDF from "@embedpdf/snippet";
import { CheckCircle2, Download, FileBadge2, FileText, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const PdfWorkspacePage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const viewerHostRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
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

  const loadFile = (file: File | null) => {
    if (!file) {
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast({
        title: "PDF required",
        description: "Upload a PDF file to preview it in the viewer.",
      });
      return;
    }

    setUploadedFile(file);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    loadFile(event.target.files?.[0] ?? null);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    loadFile(event.dataTransfer.files?.[0] ?? null);
  };

  const handleDownload = () => {
    if (!fileUrl || !uploadedFile) {
      return;
    }

    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = uploadedFile.name;
    link.click();
  };

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_32%,#ffffff_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-950 px-6 py-5 text-white lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
                PDF Viewer Workspace
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                Upload and review PDFs in a full-screen EmbedPDF workspace
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                className="bg-white text-slate-950 hover:bg-slate-100"
                onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload PDF
              </Button>
              <Button
                variant="outline"
                className="border-slate-700 bg-transparent text-white hover:bg-slate-900"
                onClick={handleDownload}
                disabled={!uploadedFile}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>

          <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <Card className="overflow-hidden border-slate-200 shadow-none">
              <CardHeader className="border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-slate-950">Document Viewer</CardTitle>
                    <CardDescription>
                      Full-screen embedded PDF viewing without the translation panel noise.
                    </CardDescription>
                  </div>
                  {uploadedFile ? (
                    <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Loaded
                    </div>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!uploadedFile ? (
                  <div
                    className={`m-6 flex min-h-[780px] cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed px-8 text-center transition ${
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
                      Drop a PDF to open the viewer
                    </h2>
                    <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                      Clean full-screen viewing only. Upload a document and review it without the translation workspace.
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
                  <div className="flex min-h-[780px] flex-col bg-slate-100">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-950">{uploadedFile.name}</p>
                        <p className="text-xs text-slate-500">{metadata?.size} · Ready for viewing</p>
                      </div>
                      <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                        EmbedPDF viewer
                      </div>
                    </div>
                    <div ref={viewerHostRef} className="h-[920px] w-full bg-white" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-none">
              <CardHeader className="border-b border-slate-200 bg-slate-50">
                <CardTitle className="flex items-center text-slate-950">
                  <FileBadge2 className="mr-2 h-5 w-5 text-sky-700" />
                  Document Details
                </CardTitle>
                <CardDescription>
                  Lightweight metadata panel for the currently loaded PDF.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 p-6 text-sm text-slate-700">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="text-slate-500">Document</span>
                  <span className="max-w-[60%] truncate font-medium text-slate-950">
                    {metadata?.name ?? "Awaiting upload"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="text-slate-500">File size</span>
                  <span className="font-medium text-slate-950">{metadata?.size ?? "Not available"}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="text-slate-500">Last modified</span>
                  <span className="font-medium text-slate-950">{metadata?.modified ?? "Not available"}</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  <p className="font-medium text-slate-950">Workspace note</p>
                  <p className="mt-2">
                    This route is now a pure PDF viewer. Translation generation has been removed so it behaves like a normal document review surface.
                  </p>
                </div>
              </CardContent>
            </Card>
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
