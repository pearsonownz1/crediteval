import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import EmbedPDF from "@embedpdf/snippet";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileBadge2,
  FileText,
  Link2,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Radio,
  RefreshCw,
  Save,
  Send,
  Upload,
  Video,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { DEFAULT_AGORA_CHANNEL, useAgoraCall } from "@/hooks/useAgoraCall";
import {
  buildCallSessionPath,
  buildPdfSessionPath,
  buildSessionSearchParams,
  createSessionId,
  normalizeSessionId,
  normalizeSessionName,
  resolveSession,
} from "@/lib/collabSession";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

const STORAGE_BUCKET = "pdf-collab";

const statusStyles = {
  idle: "border-slate-200 bg-slate-50 text-slate-700",
  joining: "border-sky-200 bg-sky-50 text-sky-700",
  joined: "border-emerald-200 bg-emerald-50 text-emerald-700",
  leaving: "border-amber-200 bg-amber-50 text-amber-700",
} as const;

type ChatMessage = {
  id: number;
  author: string;
  role: "You" | "Team";
  text: string;
  timestamp: string;
};

type SessionDocument = {
  sessionId: string;
  sessionName: string;
  storagePath: string | null;
  publicUrl: string | null;
  originalFilename: string | null;
  fileSize: number | null;
  uploadedAt: string | null;
};

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    author: "Elena",
    role: "Team",
    text: "I’m in. Keep the birth certificate open while we verify the dates against the intake notes.",
    timestamp: "9:12 AM",
  },
  {
    id: 2,
    author: "Ops",
    role: "Team",
    text: "If someone else joins from the invite link, they’ll land in this same review room and call session.",
    timestamp: "9:18 AM",
  },
];

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatUploadedAt = (value: string | null) => {
  if (!value) {
    return "Not uploaded yet";
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const safeFileName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

export default function PdfWorkspacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const resolvedSession = useMemo(() => resolveSession(searchParams), [searchParams]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const viewerHostRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [sessionIdInput, setSessionIdInput] = useState(resolvedSession.sessionId);
  const [sessionNameInput, setSessionNameInput] = useState(resolvedSession.sessionName);
  const [documentRecord, setDocumentRecord] = useState<SessionDocument | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const { toast } = useToast();

  const {
    channelName,
    token,
    status,
    errorMessage,
    statusMessage,
    remoteParticipants,
    isMicEnabled,
    isCameraEnabled,
    isJoined,
    isBusy,
    normalizedChannel,
    localVideoContainerRef,
    remoteVideoRefs,
    setChannelName,
    setToken,
    joinCall,
    leaveCall,
    toggleMicrophone,
    toggleCamera,
  } = useAgoraCall({
    initialChannel: resolvedSession.channelName || DEFAULT_AGORA_CHANNEL,
    initialToken: resolvedSession.token,
    readyMessage: "Ready to bring reviewers into the room. Share the invite link so they land in the same PDF session and Agora channel.",
    joinedMessage: (channel) => `Connected to "${channel}". Everyone on the shared session link joins this same call room.`,
    leftMessage: "Call ended. The shared PDF session is still live, and you can rejoin whenever you need.",
  });

  useEffect(() => {
    if (!searchParams.get("session")) {
      const nextSessionId = normalizeSessionId(searchParams.get("channel") || createSessionId());
      const nextSessionName = normalizeSessionName(searchParams.get("name"), nextSessionId);
      const nextToken = (searchParams.get("token") || "").trim();

      setSearchParams(buildSessionSearchParams(nextSessionId, nextSessionName, nextToken), { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    setSessionIdInput(resolvedSession.sessionId);
    setSessionNameInput(resolvedSession.sessionName);
    setChannelName(resolvedSession.channelName);
    setToken(resolvedSession.token);
  }, [resolvedSession.channelName, resolvedSession.sessionId, resolvedSession.sessionName, resolvedSession.token, setChannelName, setToken]);

  useEffect(() => {
    let isActive = true;

    const loadSession = async () => {
      setIsLoadingSession(true);
      setSessionError("");

      const { data, error } = await supabase
        .from("pdf_collab_sessions")
        .select("session_id, session_name, storage_path, public_url, original_filename, file_size, uploaded_at")
        .eq("session_id", resolvedSession.sessionId)
        .maybeSingle();

      if (!isActive) {
        return;
      }

      if (error) {
        setSessionError(error.message);
        setIsLoadingSession(false);
        return;
      }

      if (data) {
        const nextRecord: SessionDocument = {
          sessionId: data.session_id,
          sessionName: data.session_name,
          storagePath: data.storage_path,
          publicUrl: data.public_url,
          originalFilename: data.original_filename,
          fileSize: data.file_size,
          uploadedAt: data.uploaded_at,
        };
        setDocumentRecord(nextRecord);
        setViewerUrl(nextRecord.publicUrl);
        if (data.session_name && data.session_name !== resolvedSession.sessionName) {
          setSessionNameInput(data.session_name);
        }
      } else {
        setDocumentRecord({
          sessionId: resolvedSession.sessionId,
          sessionName: resolvedSession.sessionName,
          storagePath: null,
          publicUrl: null,
          originalFilename: null,
          fileSize: null,
          uploadedAt: null,
        });
        setViewerUrl(null);
      }

      setIsLoadingSession(false);
    };

    void loadSession();

    return () => {
      isActive = false;
    };
  }, [resolvedSession.sessionId, resolvedSession.sessionName]);

  useEffect(() => {
    if (!viewerHostRef.current) {
      return;
    }

    const host = viewerHostRef.current;
    host.innerHTML = "";

    if (!viewerUrl) {
      return;
    }

    EmbedPDF.init({
      type: "container",
      target: host,
      src: viewerUrl,
    });

    return () => {
      host.innerHTML = "";
    };
  }, [viewerUrl]);

  const metadata = useMemo(() => {
    if (!documentRecord) {
      return null;
    }

    return {
      name: documentRecord.originalFilename ?? "Awaiting upload",
      size: documentRecord.fileSize ? formatFileSize(documentRecord.fileSize) : "Not available",
      uploadedAt: formatUploadedAt(documentRecord.uploadedAt),
    };
  }, [documentRecord]);

  const persistSession = async (
    nextSessionId: string,
    nextSessionName: string,
    overrides?: Partial<SessionDocument>,
    announce = true,
  ) => {
    const payload = {
      session_id: nextSessionId,
      session_name: nextSessionName,
      storage_path: overrides?.storagePath ?? documentRecord?.storagePath ?? null,
      public_url: overrides?.publicUrl ?? documentRecord?.publicUrl ?? null,
      original_filename: overrides?.originalFilename ?? documentRecord?.originalFilename ?? null,
      file_size: overrides?.fileSize ?? documentRecord?.fileSize ?? null,
      uploaded_at: overrides?.uploadedAt ?? documentRecord?.uploadedAt ?? null,
    };

    const { data, error } = await supabase
      .from("pdf_collab_sessions")
      .upsert(payload, { onConflict: "session_id" })
      .select("session_id, session_name, storage_path, public_url, original_filename, file_size, uploaded_at")
      .single();

    if (error) {
      setSessionError(error.message);
      throw error;
    }

    const nextRecord: SessionDocument = {
      sessionId: data.session_id,
      sessionName: data.session_name,
      storagePath: data.storage_path,
      publicUrl: data.public_url,
      originalFilename: data.original_filename,
      fileSize: data.file_size,
      uploadedAt: data.uploaded_at,
    };

    setDocumentRecord(nextRecord);
    setViewerUrl(nextRecord.publicUrl);

    if (announce) {
      toast({
        title: "Session saved",
        description: `Review room ${nextSessionId} is ready to share.`,
      });
    }

    return nextRecord;
  };

  const applySessionDetails = async (options?: { announce?: boolean }) => {
    const nextSessionId = normalizeSessionId(sessionIdInput);
    const nextSessionName = normalizeSessionName(sessionNameInput, nextSessionId);
    const nextToken = token.trim();

    setSessionIdInput(nextSessionId);
    setSessionNameInput(nextSessionName);
    setChannelName(nextSessionId);
    await persistSession(nextSessionId, nextSessionName, undefined, options?.announce !== false);
    setSearchParams(buildSessionSearchParams(nextSessionId, nextSessionName, nextToken));

    return { nextSessionId, nextSessionName, nextToken };
  };

  const uploadFileToSession = async (file: File) => {
    const nextSessionId = normalizeSessionId(sessionIdInput || resolvedSession.sessionId);
    const nextSessionName = normalizeSessionName(sessionNameInput || resolvedSession.sessionName, nextSessionId);
    const storagePath = `${nextSessionId}/${Date.now()}-${safeFileName(file.name)}`;

    setIsUploading(true);
    setSessionError("");

    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || "application/pdf",
    });

    if (uploadError) {
      setIsUploading(false);
      setSessionError(uploadError.message);
      toast({
        title: "Upload failed",
        description: uploadError.message,
        variant: "destructive",
      });
      return;
    }

    const { data: publicUrlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
    const uploadedAt = new Date().toISOString();

    await persistSession(
      nextSessionId,
      nextSessionName,
      {
        storagePath,
        publicUrl: publicUrlData.publicUrl,
        originalFilename: file.name,
        fileSize: file.size,
        uploadedAt,
      },
      false,
    );

    setSearchParams(buildSessionSearchParams(nextSessionId, nextSessionName, token.trim()));
    setIsUploading(false);
    toast({
      title: "PDF uploaded",
      description: `Everyone on session ${nextSessionId} can now open the same document.`,
    });
  };

  const loadFile = async (file: File | null) => {
    if (!file) {
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast({
        title: "PDF required",
        description: "Upload a PDF file to preview and share it with collaborators.",
      });
      return;
    }

    await uploadFileToSession(file);
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

  const handleDownload = () => {
    if (!viewerUrl || !documentRecord?.originalFilename) {
      return;
    }

    const link = document.createElement("a");
    link.href = viewerUrl;
    link.download = documentRecord.originalFilename;
    link.click();
  };

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!chatDraft.trim()) return;

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        author: "You",
        role: "You",
        text: chatDraft.trim(),
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      },
    ]);
    setChatDraft("");
  };

  const handleCopyInviteLink = async () => {
    const nextSessionId = normalizeSessionId(sessionIdInput || resolvedSession.sessionId);
    const nextSessionName = normalizeSessionName(sessionNameInput || resolvedSession.sessionName, nextSessionId);
    const inviteUrl = `${window.location.origin}${buildPdfSessionPath(nextSessionId, nextSessionName, token.trim())}`;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast({
        title: "Invite link copied",
        description: "Share it with another reviewer to join the same document room.",
      });
    } catch {
      toast({ title: "Copy failed", description: inviteUrl });
    }
  };

  const handleNewSession = () => {
    const nextSessionId = createSessionId();
    const nextSessionName = normalizeSessionName("", nextSessionId);
    setSessionIdInput(nextSessionId);
    setSessionNameInput(nextSessionName);
    setDocumentRecord({
      sessionId: nextSessionId,
      sessionName: nextSessionName,
      storagePath: null,
      publicUrl: null,
      originalFilename: null,
      fileSize: null,
      uploadedAt: null,
    });
    setViewerUrl(null);
    setSearchParams(buildSessionSearchParams(nextSessionId, nextSessionName, token.trim()));
    toast({ title: "New session created", description: `Room ${nextSessionId} is ready for a new document.` });
  };

  const callPath = buildCallSessionPath(resolvedSession.sessionId, resolvedSession.sessionName, token.trim());
  const invitePath = buildPdfSessionPath(resolvedSession.sessionId, resolvedSession.sessionName, token.trim());

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_30%,#ffffff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-5">
        <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.10)]">
          <div className="flex flex-col gap-5 border-b border-slate-200 bg-slate-950 px-6 py-5 text-white xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">Collaborative PDF review</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Review the document, keep the call live, and share the same file with the room</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Upload once to Supabase, share the invite link, and everyone lands in the same document session while the Agora call runs beside it.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" className="border-slate-700 bg-transparent text-white hover:bg-slate-900" onClick={handleCopyInviteLink}>
                <Link2 className="mr-2 h-4 w-4" />
                Invite
              </Button>
              <Badge variant="outline" className={cn("rounded-full border px-3 py-1 text-xs font-medium", statusStyles[status])}>
                <Radio className="mr-1.5 h-3.5 w-3.5" />
                {status === "idle" ? "Call ready" : status === "joining" ? "Joining" : status === "joined" ? "Live" : "Leaving"}
              </Badge>
              <Button variant="secondary" className="bg-white text-slate-950 hover:bg-slate-100" onClick={() => fileInputRef.current?.click()} disabled={isUploading || isLoadingSession}>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload PDF
              </Button>
              <Button variant="outline" className="border-slate-700 bg-transparent text-white hover:bg-slate-900" onClick={handleDownload} disabled={!documentRecord?.publicUrl}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>

          <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.6fr)_420px]">
            <Card className="overflow-hidden border-slate-200 shadow-none">
              <CardHeader className="border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-slate-950">Document viewer</CardTitle>
                    <CardDescription>One uploaded PDF, one shared session, one less reason to send weird screenshots in Slack.</CardDescription>
                  </div>
                  {documentRecord?.publicUrl ? (
                    <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Shared
                    </div>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!documentRecord?.publicUrl ? (
                  <div
                    className={cn(
                      "m-6 flex min-h-[820px] cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed px-8 text-center transition",
                      isDragging ? "border-sky-500 bg-sky-50" : "border-slate-300 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]",
                    )}
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
                    onDrop={handleDrop}
                  >
                    <div className="mb-5 rounded-full bg-sky-100 p-4 text-sky-700">
                      <FileText className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-semibold text-slate-950">Drop a PDF to launch the shared review workspace</h2>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                      The uploaded file is stored on the server and attached to this session so everyone with the invite link can view the same document while on video.
                    </p>
                    <Button className="mt-6">
                      <Upload className="mr-2 h-4 w-4" />
                      Choose PDF
                    </Button>
                    <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-400">Drag and drop or click to browse</p>
                  </div>
                ) : (
                  <div className="flex min-h-[820px] flex-col bg-slate-100">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-950">{documentRecord.originalFilename}</p>
                        <p className="text-xs text-slate-500">{metadata?.size} · Shared in session {resolvedSession.sessionId}</p>
                      </div>
                      <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">EmbedPDF viewer</div>
                    </div>
                    <div ref={viewerHostRef} className="h-[980px] w-full bg-white" />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex min-h-[820px] flex-col gap-5">
              <Card className="border-slate-200 shadow-none">
                <CardHeader className="border-b border-slate-200 bg-slate-50 pb-4">
                  <CardTitle className="flex items-center text-slate-950">
                    <FileBadge2 className="mr-2 h-5 w-5 text-sky-700" />
                    Review snapshot
                  </CardTitle>
                  <CardDescription>Session, file, and sharing state for the current workspace.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 p-5 text-sm text-slate-700">
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <span className="text-slate-500">Session name</span>
                    <span className="max-w-[58%] truncate text-right font-medium text-slate-950">{resolvedSession.sessionName}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <span className="text-slate-500">Session ID</span>
                    <span className="font-mono text-xs font-medium text-slate-950">{resolvedSession.sessionId}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <span className="text-slate-500">Document</span>
                    <span className="max-w-[58%] truncate text-right font-medium text-slate-950">{metadata?.name ?? "Awaiting upload"}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <span className="text-slate-500">Uploaded</span>
                    <span className="text-right font-medium text-slate-950">{metadata?.uploadedAt ?? "Not uploaded yet"}</span>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    <p className="font-medium text-slate-950">Share behavior</p>
                    <p className="mt-2">Invitees who open this session link land in the same review room and Agora channel, and the PDF now loads from Supabase storage instead of living only in one browser tab.</p>
                  </div>
                  {sessionError ? (
                    <Alert variant="destructive">
                      <AlertTitle>Session error</AlertTitle>
                      <AlertDescription>{sessionError}</AlertDescription>
                    </Alert>
                  ) : null}
                </CardContent>
              </Card>

              <Tabs defaultValue="call" className="flex min-h-0 flex-1 flex-col">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                  <TabsTrigger value="call"><Video className="mr-2 h-4 w-4" />Call</TabsTrigger>
                  <TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4" />Chat</TabsTrigger>
                </TabsList>

                <TabsContent value="call" className="mt-4 flex-1">
                  <Card className="h-full border-slate-200 shadow-none">
                    <CardHeader className="border-b border-slate-200 bg-slate-50 pb-4">
                      <CardTitle className="text-slate-950">Live call controls</CardTitle>
                      <CardDescription>The Agora room uses this same session ID, so every reviewer on the link lands in the same video room.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-5">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700" htmlFor="workspace-session-name">Session name</label>
                        <Input id="workspace-session-name" value={sessionNameInput} onChange={(event) => setSessionNameInput(event.target.value)} disabled={isBusy || isUploading} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700" htmlFor="workspace-session-id">Session ID / Agora room</label>
                        <Input id="workspace-session-id" value={sessionIdInput} onChange={(event) => { setSessionIdInput(event.target.value); setChannelName(event.target.value); }} disabled={isBusy || isUploading} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700" htmlFor="workspace-token">Token (optional)</label>
                        <Input id="workspace-token" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Paste an Agora token if required" disabled={isBusy || isUploading} />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" className="border-slate-300" onClick={handleCopyInviteLink} disabled={isBusy || isUploading}>
                          <Copy className="mr-2 h-4 w-4" />Copy link
                        </Button>
                        <Button type="button" variant="outline" className="border-slate-300" onClick={handleNewSession} disabled={isBusy || isUploading}>
                          <RefreshCw className="mr-2 h-4 w-4" />New session
                        </Button>
                        <Button type="button" onClick={() => void applySessionDetails()} disabled={isBusy || isUploading}>
                          <Save className="mr-2 h-4 w-4" />Save session
                        </Button>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        <p className="font-medium text-slate-950">Shared invite</p>
                        <p className="mt-2 break-all text-xs text-slate-500">{window.location.origin}{invitePath}</p>
                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                          <ExternalLink className="h-3.5 w-3.5" />
                          <Link to={callPath} className="font-medium text-sky-700 hover:text-sky-800">Open standalone call page</Link>
                        </div>
                      </div>

                      <Alert className="border-slate-200 bg-slate-50">
                        <AlertTitle>Agora status</AlertTitle>
                        <AlertDescription>{statusMessage}</AlertDescription>
                      </Alert>
                      {errorMessage ? <Alert variant="destructive"><AlertTitle>Call error</AlertTitle><AlertDescription>{errorMessage}</AlertDescription></Alert> : null}

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Button onClick={() => void joinCall()} disabled={isJoined || isBusy} className="h-11">
                          {status === "joining" ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}Join call
                        </Button>
                        <Button variant="outline" onClick={() => void leaveCall()} disabled={!isJoined || isBusy} className="h-11 border-slate-300">
                          <PhoneOff className="mr-2 h-4 w-4" />Leave
                        </Button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Button variant="outline" onClick={() => void toggleMicrophone()} disabled={!isJoined || isBusy} className="border-slate-300">
                          {isMicEnabled ? <Mic className="mr-2 h-4 w-4" /> : <MicOff className="mr-2 h-4 w-4" />}
                          {isMicEnabled ? "Mute mic" : "Unmute mic"}
                        </Button>
                        <Button variant="outline" onClick={() => void toggleCamera()} disabled={!isJoined || isBusy} className="border-slate-300">
                          {isCameraEnabled ? <Camera className="mr-2 h-4 w-4" /> : <CameraOff className="mr-2 h-4 w-4" />}
                          {isCameraEnabled ? "Camera off" : "Camera on"}
                        </Button>
                      </div>

                      <div className="grid gap-3 lg:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-950 p-3 text-white">
                          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Local</p>
                          <div ref={localVideoContainerRef} className="h-40 rounded-xl bg-slate-900" />
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Remote</p>
                            <Badge variant="outline" className="border-slate-300 text-slate-600">{remoteParticipants.length} connected</Badge>
                          </div>
                          <div className="grid gap-3">
                            {remoteParticipants.length ? remoteParticipants.map((participant) => (
                              <div key={participant.uid} className="rounded-xl border border-slate-200 bg-white p-3">
                                <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                                  <span>{participant.uid}</span>
                                  <span>{participant.hasAudio ? "Audio on" : "Audio off"} · {participant.hasVideo ? "Video on" : "Video off"}</span>
                                </div>
                                <div ref={(element) => { remoteVideoRefs.current[participant.uid] = element; }} className="h-28 rounded-lg bg-slate-100" />
                              </div>
                            )) : <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">No one else has joined yet.</div>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="chat" className="mt-4 flex-1">
                  <Card className="flex h-full flex-col border-slate-200 shadow-none">
                    <CardHeader className="border-b border-slate-200 bg-slate-50 pb-4">
                      <CardTitle className="text-slate-950">Review chat</CardTitle>
                      <CardDescription>Lightweight room chat for notes while the call is running. Still prototype-local for now.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-5">
                      <ScrollArea className="h-[360px] rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="space-y-4 pr-3">
                          {messages.map((message) => (
                            <div key={message.id} className={cn("flex gap-3", message.role === "You" ? "justify-end" : "justify-start")}>
                              {message.role === "Team" ? <Avatar className="h-8 w-8"><AvatarFallback>{message.author.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar> : null}
                              <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6", message.role === "You" ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700")}>
                                <div className="mb-1 flex items-center gap-2 text-xs font-medium opacity-75">
                                  <span>{message.author}</span>
                                  <span>{message.timestamp}</span>
                                </div>
                                <p>{message.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <Separator />
                      <form className="space-y-3" onSubmit={handleSendMessage}>
                        <Input value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} placeholder="Send a quick note to the room…" />
                        <div className="flex justify-end">
                          <Button type="submit" disabled={!chatDraft.trim()}>
                            <Send className="mr-2 h-4 w-4" />Send
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handleFileChange} />
    </section>
  );
}
