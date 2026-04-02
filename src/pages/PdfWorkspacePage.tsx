import { ChangeEvent, DragEvent, MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import EmbedPDF from "@embedpdf/snippet";
import {
  AlertCircle,
  Camera,
  CameraOff,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileSignature,
  FileText,
  Link2,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  PenLine,
  Phone,
  PhoneOff,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
const PARTICIPANT_NAME_STORAGE_KEY = "pdf-signature-participant-name";
const COLLABORATION_POLL_INTERVAL_MS = 1200;

const flagTypeConfig = {
  sign: {
    label: "Sign here",
    shortLabel: "Sign",
    marker: "S",
    accent: "#0f172a",
    badge: "border-slate-200 bg-slate-50 text-slate-700",
  },
  initial: {
    label: "Initial here",
    shortLabel: "Initial",
    marker: "I",
    accent: "#9a3412",
    badge: "border-orange-200 bg-orange-50 text-orange-700",
  },
  date: {
    label: "Date here",
    shortLabel: "Date",
    marker: "D",
    accent: "#1d4ed8",
    badge: "border-sky-200 bg-sky-50 text-sky-700",
  },
} as const;

type SignatureFlagType = keyof typeof flagTypeConfig;

type SessionDocument = {
  sessionId: string;
  sessionName: string;
  storagePath: string | null;
  publicUrl: string | null;
  originalFilename: string | null;
  fileSize: number | null;
  uploadedAt: string | null;
};

type SignatureFlagRecord = {
  id: string;
  sessionId: string;
  documentStoragePath: string | null;
  createdByName: string;
  createdById: string;
  flagType: SignatureFlagType;
  label: string | null;
  xPercent: number;
  yPercent: number;
  signedByName: string | null;
  signedByText: string | null;
  signedAt: string | null;
  signerProfileId: string | null;
  signerNote: string | null;
  createdAt: string;
  updatedAt: string;
};

type CommentRecord = {
  id: string;
  sessionId: string;
  annotationId: string | null;
  parentId: string | null;
  authorId: string;
  authorName: string;
  color: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

type PlacementDraft = {
  flagType: SignatureFlagType;
  label: string;
};

type SignDraft = {
  signerName: string;
  signatureText: string;
  note: string;
};

const defaultPlacementDraft = (): PlacementDraft => ({
  flagType: "sign",
  label: "",
});

const defaultSignDraft = (participantName: string): SignDraft => ({
  signerName: participantName,
  signatureText: participantName,
  note: "",
});

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatUploadedAt = (value: string | null) => {
  if (!value) return "Not uploaded yet";

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatTimelineTimestamp = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const safeFileName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

const getStoredParticipantName = () => {
  if (typeof window === "undefined") {
    return "Signer";
  }

  const existingName = window.localStorage.getItem(PARTICIPANT_NAME_STORAGE_KEY);
  return existingName?.trim() || `Signer ${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
};

const getParticipantProfileId = () => {
  if (typeof window === "undefined") {
    return "signer-server";
  }

  const storageKey = "pdf-signature-profile-id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const next = `signer-${createSessionId()}`;
  window.localStorage.setItem(storageKey, next);
  return next;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "SG";

const normalizeCommentRecord = (comment: Record<string, string | null>): CommentRecord => ({
  id: String(comment.id),
  sessionId: String(comment.session_id),
  annotationId: (comment.annotation_id as string | null) ?? null,
  parentId: (comment.parent_id as string | null) ?? null,
  authorId: String(comment.author_id),
  authorName: String(comment.author_name),
  color: String(comment.color),
  body: String(comment.body ?? ""),
  createdAt: String(comment.created_at),
  updatedAt: String(comment.updated_at ?? comment.created_at),
});

const normalizeSignatureFlagRecord = (flag: Record<string, string | number | null>): SignatureFlagRecord => ({
  id: String(flag.id),
  sessionId: String(flag.session_id),
  documentStoragePath: (flag.document_storage_path as string | null) ?? null,
  createdByName: String(flag.created_by_name),
  createdById: String(flag.created_by_id),
  flagType: ((flag.flag_type as SignatureFlagType | null) ?? "sign"),
  label: (flag.label as string | null) ?? null,
  xPercent: Number(flag.x_percent),
  yPercent: Number(flag.y_percent),
  signedByName: (flag.signed_by_name as string | null) ?? null,
  signedByText: (flag.signed_by_text as string | null) ?? null,
  signedAt: (flag.signed_at as string | null) ?? null,
  signerProfileId: (flag.signer_profile_id as string | null) ?? null,
  signerNote: (flag.signer_note as string | null) ?? null,
  createdAt: String(flag.created_at),
  updatedAt: String(flag.updated_at ?? flag.created_at),
});

const removeCommentBranch = (records: CommentRecord[], rootId: string) => {
  const blocked = new Set<string>([rootId]);
  let didExpand = true;

  while (didExpand) {
    didExpand = false;
    records.forEach((record) => {
      if (record.parentId && blocked.has(record.parentId) && !blocked.has(record.id)) {
        blocked.add(record.id);
        didExpand = true;
      }
    });
  }

  return records.filter((record) => !blocked.has(record.id));
};

function ThreadList({
  comments,
  replyDraft,
  replyParentId,
  setReplyDraft,
  setReplyParentId,
  onSubmitReply,
  onDeleteComment,
}: {
  comments: CommentRecord[];
  replyDraft: string;
  replyParentId: string | null;
  setReplyDraft: (value: string) => void;
  setReplyParentId: (value: string | null) => void;
  onSubmitReply: (parentId: string | null) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
}) {
  const commentsByParent = useMemo(() => {
    const groups = new Map<string | null, CommentRecord[]>();
    comments.forEach((comment) => {
      const existing = groups.get(comment.parentId) ?? [];
      groups.set(comment.parentId, [...existing, comment]);
    });
    return groups;
  }, [comments]);

  const renderBranch = (parentId: string | null, depth: number): JSX.Element[] =>
    (commentsByParent.get(parentId) ?? []).map((comment) => (
      <div key={comment.id} className={cn("space-y-3", depth > 0 ? "ml-5 border-l border-slate-200 pl-4" : "")}> 
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <Avatar className="h-9 w-9 border border-slate-200">
                <AvatarFallback>{getInitials(comment.authorName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-950">{comment.authorName}</p>
                  <span className="text-xs text-slate-400">{formatTimelineTimestamp(comment.createdAt)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.body}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-500" onClick={() => {
                setReplyParentId(comment.id);
                setReplyDraft("");
              }}>
                Reply
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-500" onClick={() => void onDeleteComment(comment.id)}>
                Delete
              </Button>
            </div>
          </div>
          {replyParentId === comment.id ? (
            <form
              className="mt-4 space-y-3 border-t border-slate-200 pt-4"
              onSubmit={(event) => {
                event.preventDefault();
                void onSubmitReply(comment.id);
              }}
            >
              <Textarea
                value={replyDraft}
                onChange={(event) => setReplyDraft(event.target.value)}
                placeholder="Reply to this thread..."
                className="min-h-[92px] border-slate-200 bg-slate-50"
              />
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="ghost" className="text-slate-500" onClick={() => {
                  setReplyParentId(null);
                  setReplyDraft("");
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!replyDraft.trim()}>
                  <Send className="mr-2 h-4 w-4" />
                  Reply
                </Button>
              </div>
            </form>
          ) : null}
        </div>
        {renderBranch(comment.id, depth + 1)}
      </div>
    ));

  return <div className="space-y-3">{renderBranch(null, 0)}</div>;
}

export default function PdfWorkspacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const resolvedSession = useMemo(() => resolveSession(searchParams), [searchParams]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const viewerHostRef = useRef<HTMLDivElement | null>(null);
  const participantProfileId = useRef(getParticipantProfileId());

  const [isDragging, setIsDragging] = useState(false);
  const [sessionIdInput, setSessionIdInput] = useState(resolvedSession.sessionId);
  const [sessionNameInput, setSessionNameInput] = useState(resolvedSession.sessionName);
  const [participantName, setParticipantName] = useState(getStoredParticipantName);
  const [documentRecord, setDocumentRecord] = useState<SessionDocument | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [signatureFlags, setSignatureFlags] = useState<SignatureFlagRecord[]>([]);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [selectedFlagId, setSelectedFlagId] = useState<string | null>(null);
  const [placementMode, setPlacementMode] = useState(false);
  const [placementDraft, setPlacementDraft] = useState<PlacementDraft>(defaultPlacementDraft);
  const [signDraft, setSignDraft] = useState<SignDraft>(defaultSignDraft(getStoredParticipantName()));
  const [sessionNoteDraft, setSessionNoteDraft] = useState("");
  const [sessionReplyDraft, setSessionReplyDraft] = useState("");
  const [sessionReplyParentId, setSessionReplyParentId] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingFlag, setIsSavingFlag] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [collaborationError, setCollaborationError] = useState("");
  const { toast } = useToast();

  const {
    token,
    status,
    errorMessage,
    statusMessage,
    remoteParticipants,
    isMicEnabled,
    isCameraEnabled,
    isJoined,
    isBusy,
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
    readyMessage: "Ready to review the document together. Share the session link so everyone lands on the same PDF.",
    joinedMessage: (channel) => `Connected to "${channel}". Everyone on the shared session link joins this same call room.`,
    leftMessage: "Call ended. The shared PDF session is still live.",
  });

  const selectedFlag = useMemo(
    () => signatureFlags.find((flag) => flag.id === selectedFlagId) ?? null,
    [signatureFlags, selectedFlagId],
  );
  const sessionChat = useMemo(() => comments.filter((comment) => comment.annotationId === null), [comments]);
  const signedCount = useMemo(() => signatureFlags.filter((flag) => flag.signedAt).length, [signatureFlags]);
  const pendingCount = signatureFlags.length - signedCount;
  const metadata = useMemo(() => {
    if (!documentRecord) return null;

    return {
      name: documentRecord.originalFilename ?? "Awaiting upload",
      size: documentRecord.fileSize ? formatFileSize(documentRecord.fileSize) : "Not available",
      uploadedAt: formatUploadedAt(documentRecord.uploadedAt),
    };
  }, [documentRecord]);

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
    window.localStorage.setItem(PARTICIPANT_NAME_STORAGE_KEY, participantName.trim() || "Signer");
    setSignDraft((current) => ({
      ...current,
      signerName: current.signerName ? current.signerName : participantName.trim() || "Signer",
      signatureText: current.signatureText ? current.signatureText : participantName.trim() || "Signer",
    }));
  }, [participantName]);

  useEffect(() => {
    let isActive = true;
    let isFetching = false;

    const loadSession = async () => {
      if (isFetching) return;
      isFetching = true;

      const { data, error } = await supabase
        .from("pdf_collab_sessions")
        .select("session_id, session_name, storage_path, public_url, original_filename, file_size, uploaded_at")
        .eq("session_id", resolvedSession.sessionId)
        .maybeSingle();

      if (!isActive) return;

      if (error) {
        setSessionError(error.message);
        isFetching = false;
        return;
      }

      setSessionError("");
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
      isFetching = false;
    };

    setIsLoadingSession(true);
    void loadSession();
    const intervalId = window.setInterval(() => {
      void loadSession();
    }, COLLABORATION_POLL_INTERVAL_MS);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [resolvedSession.sessionId, resolvedSession.sessionName]);

  useEffect(() => {
    let isMounted = true;
    let isFetching = false;

    const loadSharedState = async () => {
      if (isFetching) return;
      isFetching = true;

      const [{ data: flagData, error: flagError }, { data: commentData, error: commentError }] = await Promise.all([
        supabase
          .from("pdf_signature_flags")
          .select("id, session_id, document_storage_path, created_by_name, created_by_id, flag_type, label, x_percent, y_percent, signed_by_name, signed_by_text, signed_at, signer_profile_id, signer_note, created_at, updated_at")
          .eq("session_id", resolvedSession.sessionId)
          .order("created_at", { ascending: true }),
        supabase
          .from("pdf_collab_comments")
          .select("id, session_id, annotation_id, parent_id, author_id, author_name, color, body, created_at, updated_at")
          .eq("session_id", resolvedSession.sessionId)
          .is("annotation_id", null)
          .order("created_at", { ascending: true }),
      ]);

      if (!isMounted) {
        isFetching = false;
        return;
      }

      if (flagError) {
        setCollaborationError(flagError.message);
      } else {
        setCollaborationError("");
        setSignatureFlags((flagData || []).map((flag) => normalizeSignatureFlagRecord(flag as unknown as Record<string, string | number | null>)));
      }

      if (!commentError) {
        setComments((commentData || []).map((comment) => normalizeCommentRecord(comment as unknown as Record<string, string | null>)));
      }

      isFetching = false;
    };

    setSignatureFlags([]);
    setComments([]);
    setSelectedFlagId(null);

    void loadSharedState();
    const intervalId = window.setInterval(() => {
      void loadSharedState();
    }, COLLABORATION_POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [resolvedSession.sessionId]);

  useEffect(() => {
    if (!selectedFlag) {
      setSignDraft(defaultSignDraft(participantName.trim() || "Signer"));
      return;
    }

    setSignDraft({
      signerName: selectedFlag.signedByName || participantName.trim() || "Signer",
      signatureText: selectedFlag.signedByText || participantName.trim() || "Signer",
      note: selectedFlag.signerNote || "",
    });
  }, [participantName, selectedFlag]);

  useEffect(() => {
    if (!viewerHostRef.current) return;

    const host = viewerHostRef.current;
    host.innerHTML = "";

    if (!viewerUrl) return;

    EmbedPDF.init({
      type: "container",
      target: host,
      src: viewerUrl,
    });

    return () => {
      host.innerHTML = "";
    };
  }, [viewerUrl]);

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
        description: `Signature room ${nextSessionId} is ready to share.`,
      });
    }

    return nextRecord;
  };

  const ensureCurrentSessionRecord = async () => {
    if (documentRecord?.sessionId === resolvedSession.sessionId) {
      return documentRecord;
    }

    return persistSession(
      normalizeSessionId(sessionIdInput || resolvedSession.sessionId),
      normalizeSessionName(sessionNameInput || resolvedSession.sessionName, resolvedSession.sessionId),
      undefined,
      false,
    );
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
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
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
      description: `Everyone on session ${nextSessionId} can now open the same document and see the same signature flags.`,
    });
  };

  const loadFile = async (file: File | null) => {
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "PDF required", description: "Upload a PDF file to launch the signing room." });
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
    if (!viewerUrl || !documentRecord?.originalFilename) return;

    const link = document.createElement("a");
    link.href = viewerUrl;
    link.download = documentRecord.originalFilename;
    link.click();
  };

  const upsertFlagState = (record: SignatureFlagRecord) => {
    setSignatureFlags((current) => {
      const existingIndex = current.findIndex((flag) => flag.id === record.id);
      if (existingIndex === -1) {
        return [...current, record].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
      }

      const next = [...current];
      next[existingIndex] = record;
      return next;
    });
  };

  const upsertCommentState = (record: CommentRecord) => {
    setComments((current) => {
      const existingIndex = current.findIndex((comment) => comment.id === record.id);
      if (existingIndex === -1) {
        return [...current, record].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
      }

      const next = [...current];
      next[existingIndex] = record;
      return next;
    });
  };

  const handleFlagPlacement = async (event: ReactMouseEvent<HTMLElement>) => {
    if (!placementMode || !documentRecord?.publicUrl) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const xPercent = Number((((event.clientX - bounds.left) / bounds.width) * 100).toFixed(2));
    const yPercent = Number((((event.clientY - bounds.top) / bounds.height) * 100).toFixed(2));

    await ensureCurrentSessionRecord();

    const { data, error } = await supabase
      .from("pdf_signature_flags")
      .insert({
        session_id: resolvedSession.sessionId,
        document_storage_path: documentRecord?.storagePath ?? null,
        created_by_id: participantProfileId.current,
        created_by_name: participantName.trim() || "Signer",
        flag_type: placementDraft.flagType,
        label: placementDraft.label.trim() || null,
        x_percent: xPercent,
        y_percent: yPercent,
      })
      .select("id, session_id, document_storage_path, created_by_name, created_by_id, flag_type, label, x_percent, y_percent, signed_by_name, signed_by_text, signed_at, signer_profile_id, signer_note, created_at, updated_at")
      .single();

    if (error) {
      toast({ title: "Flag not placed", description: error.message, variant: "destructive" });
      return;
    }

    const nextFlag = normalizeSignatureFlagRecord(data as unknown as Record<string, string | number | null>);
    upsertFlagState(nextFlag);
    setSelectedFlagId(nextFlag.id);
    toast({ title: "Signature flag placed", description: `${flagTypeConfig[nextFlag.flagType].label} is now visible to everyone in the session.` });
  };

  const handleDeleteFlag = async (flagId: string) => {
    const { error } = await supabase.from("pdf_signature_flags").delete().eq("id", flagId);

    if (error) {
      toast({ title: "Flag not removed", description: error.message, variant: "destructive" });
      return;
    }

    setSignatureFlags((current) => current.filter((flag) => flag.id !== flagId));
    setSelectedFlagId((current) => (current === flagId ? null : current));
  };

  const handleSaveSignature = async () => {
    if (!selectedFlag) return;

    const signerName = signDraft.signerName.trim();
    const signatureText = signDraft.signatureText.trim();

    if (!signerName || !signatureText) {
      toast({ title: "Missing signature info", description: "Enter a signer name and signature text first.", variant: "destructive" });
      return;
    }

    setIsSavingFlag(true);
    const { data, error } = await supabase
      .from("pdf_signature_flags")
      .update({
        signed_by_name: signerName,
        signed_by_text: signatureText,
        signer_note: signDraft.note.trim() || null,
        signer_profile_id: participantProfileId.current,
        signed_at: new Date().toISOString(),
      })
      .eq("id", selectedFlag.id)
      .select("id, session_id, document_storage_path, created_by_name, created_by_id, flag_type, label, x_percent, y_percent, signed_by_name, signed_by_text, signed_at, signer_profile_id, signer_note, created_at, updated_at")
      .single();

    setIsSavingFlag(false);

    if (error) {
      toast({ title: "Signature not saved", description: error.message, variant: "destructive" });
      return;
    }

    const nextFlag = normalizeSignatureFlagRecord(data as unknown as Record<string, string | number | null>);
    upsertFlagState(nextFlag);
    toast({ title: "Signature captured", description: `${signerName} signed this flag.` });
  };

  const handleClearSignature = async () => {
    if (!selectedFlag) return;

    const { data, error } = await supabase
      .from("pdf_signature_flags")
      .update({
        signed_by_name: null,
        signed_by_text: null,
        signer_note: null,
        signer_profile_id: null,
        signed_at: null,
      })
      .eq("id", selectedFlag.id)
      .select("id, session_id, document_storage_path, created_by_name, created_by_id, flag_type, label, x_percent, y_percent, signed_by_name, signed_by_text, signed_at, signer_profile_id, signer_note, created_at, updated_at")
      .single();

    if (error) {
      toast({ title: "Signature not cleared", description: error.message, variant: "destructive" });
      return;
    }

    const nextFlag = normalizeSignatureFlagRecord(data as unknown as Record<string, string | number | null>);
    upsertFlagState(nextFlag);
    setSignDraft(defaultSignDraft(participantName.trim() || "Signer"));
    toast({ title: "Flag reset", description: "This flag is back to unsigned." });
  };

  const handleCreateComment = async (options: { body: string; parentId?: string | null; onSuccess?: () => void }) => {
    const body = options.body.trim();
    if (!body) return;

    await ensureCurrentSessionRecord();

    const { data, error } = await supabase
      .from("pdf_collab_comments")
      .insert({
        session_id: resolvedSession.sessionId,
        annotation_id: null,
        parent_id: options.parentId ?? null,
        author_id: participantProfileId.current,
        author_name: participantName.trim() || "Signer",
        color: "#0f172a",
        body,
      })
      .select("id, session_id, annotation_id, parent_id, author_id, author_name, color, body, created_at, updated_at")
      .single();

    if (error) {
      toast({ title: "Message not sent", description: error.message, variant: "destructive" });
      return;
    }

    upsertCommentState(normalizeCommentRecord(data as unknown as Record<string, string | null>));
    options.onSuccess?.();
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase.from("pdf_collab_comments").delete().eq("id", commentId);

    if (error) {
      toast({ title: "Comment not removed", description: error.message, variant: "destructive" });
      return;
    }

    setComments((current) => removeCommentBranch(current, commentId));
  };

  const handleCopyInviteLink = async () => {
    const nextSessionId = normalizeSessionId(sessionIdInput || resolvedSession.sessionId);
    const nextSessionName = normalizeSessionName(sessionNameInput || resolvedSession.sessionName, nextSessionId);
    const inviteUrl = `${window.location.origin}${buildPdfSessionPath(nextSessionId, nextSessionName, token.trim())}`;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast({ title: "Invite link copied", description: "Share it so others can view the same PDF and sign the same flags." });
    } catch {
      toast({ title: "Copy failed", description: inviteUrl });
    }
  };

  const handleRefreshSharedState = () => {
    setCollaborationError("");
    toast({ title: "Refreshing", description: "Polling for the latest flags and chat messages." });
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
    setSignatureFlags([]);
    setComments([]);
    setSelectedFlagId(null);
    setPlacementMode(false);
    setSearchParams(buildSessionSearchParams(nextSessionId, nextSessionName, token.trim()));
    toast({ title: "New session created", description: `Room ${nextSessionId} is ready for a fresh PDF.` });
  };

  const callPath = buildCallSessionPath(resolvedSession.sessionId, resolvedSession.sessionName, token.trim());
  const invitePath = buildPdfSessionPath(resolvedSession.sessionId, resolvedSession.sessionName, token.trim());

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_22%,#ffffff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-5">
        <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.10)]">
          <div className="flex flex-col gap-5 border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,#1e3a8a_0%,#0f172a_58%,#020617_100%)] px-6 py-5 text-white xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">Signature PDF workspace</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Place signature flags, share one session link, and collect lightweight signatures</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                The flaky cursor circus is gone. Upload the PDF, drop shared signature flags, and let participants sign directly on the document.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" className="border-slate-700 bg-transparent text-white hover:bg-slate-900" onClick={handleCopyInviteLink}>
                <Link2 className="mr-2 h-4 w-4" />
                Invite
              </Button>
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

          <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.65fr)_440px]">
            <Card className="overflow-hidden border-slate-200 shadow-none">
              <CardHeader className="border-b border-slate-200 bg-slate-50">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle className="text-slate-950">Document viewer</CardTitle>
                    <CardDescription>Hosts place signature flags. Participants click one and complete a typed-signature MVP.</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                      <FileSignature className="mr-1.5 h-3.5 w-3.5 text-slate-700" />
                      {signatureFlags.length} flag{signatureFlags.length === 1 ? "" : "s"}
                    </div>
                    <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      {signedCount} signed
                    </div>
                    {documentRecord?.publicUrl ? (
                      <div className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                        Shared PDF
                      </div>
                    ) : null}
                  </div>
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
                    <h2 className="text-2xl font-semibold text-slate-950">Drop a PDF to launch the shared signature room</h2>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                      Upload once, share the session link, place signature markers, and let people sign without the cursor goblins causing chaos.
                    </p>
                    <Button className="mt-6">
                      <Upload className="mr-2 h-4 w-4" />
                      Choose PDF
                    </Button>
                  </div>
                ) : (
                  <div className="flex min-h-[820px] flex-col bg-slate-100">
                    <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-4">
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-950">{documentRecord.originalFilename}</p>
                          <p className="text-xs text-slate-500">{metadata?.size} · Shared in session {resolvedSession.sessionId}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="border-slate-300 text-slate-600">{pendingCount} pending</Badge>
                          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">{signedCount} completed</Badge>
                        </div>
                      </div>

                      <div className="grid gap-3 xl:grid-cols-[auto,1fr]">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant={placementMode ? "default" : "outline"}
                            className={cn(placementMode ? "" : "border-slate-300")}
                            onClick={() => setPlacementMode((current) => !current)}
                          >
                            <PenLine className="mr-2 h-4 w-4" />
                            {placementMode ? "Placement mode on" : "Enter placement mode"}
                          </Button>
                          <Badge variant="outline" className={placementMode ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-600"}>
                            {placementMode ? "Click PDF to place a flag" : "Viewing and signing mode"}
                          </Badge>
                        </div>
                        <div className="grid gap-3 lg:grid-cols-[160px,minmax(0,1fr)]">
                          <Select value={placementDraft.flagType} onValueChange={(value: SignatureFlagType) => setPlacementDraft((current) => ({ ...current, flagType: value }))}>
                            <SelectTrigger className="border-slate-300 bg-white">
                              <SelectValue placeholder="Flag type" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(flagTypeConfig).map(([value, config]) => (
                                <SelectItem key={value} value={value}>{config.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            value={placementDraft.label}
                            onChange={(event) => setPlacementDraft((current) => ({ ...current, label: event.target.value }))}
                            placeholder="Optional label like CFO signature or Date signed"
                          />
                        </div>
                      </div>

                      {collaborationError ? (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Sync issue</AlertTitle>
                          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <span>{collaborationError}</span>
                            <Button type="button" variant="outline" className="border-red-300 bg-white text-red-700 hover:bg-red-50" onClick={handleRefreshSharedState}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Retry sync
                            </Button>
                          </AlertDescription>
                        </Alert>
                      ) : null}
                    </div>

                    <div className="relative h-[980px] w-full overflow-hidden bg-white">
                      <div ref={viewerHostRef} className="h-full w-full bg-white" />
                      <div className="absolute left-4 top-4 z-30 max-w-md rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                          {placementMode ? <PenLine className="h-4 w-4 text-amber-600" /> : <FileSignature className="h-4 w-4 text-sky-600" />}
                          {placementMode ? "Placement mode" : "Signing mode"}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {placementMode
                            ? `Click anywhere on the PDF to place a ${flagTypeConfig[placementDraft.flagType].label.toLowerCase()} marker.`
                            : "Click any flag to review it and apply a lightweight typed signature."}
                        </p>
                      </div>

                      <div className="pointer-events-none absolute inset-0 z-10">
                        {signatureFlags.map((flag, index) => {
                          const config = flagTypeConfig[flag.flagType];
                          const isSigned = Boolean(flag.signedAt);

                          return (
                            <button
                              key={flag.id}
                              type="button"
                              className={cn(
                                "pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-white px-3 py-2 text-left text-white shadow-[0_10px_30px_rgba(15,23,42,0.24)] transition hover:scale-[1.02]",
                                selectedFlagId === flag.id ? "ring-4 ring-sky-100" : "",
                                isSigned ? "opacity-95" : "",
                              )}
                              style={{
                                left: `${flag.xPercent}%`,
                                top: `${flag.yPercent}%`,
                                backgroundColor: isSigned ? "#15803d" : config.accent,
                              }}
                              onClick={() => setSelectedFlagId(flag.id)}
                              title={flag.label || config.label}
                            >
                              <div className="flex items-center gap-2">
                                <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-white/20 px-2 text-[11px] font-bold">{config.marker}</span>
                                <div className="min-w-0">
                                  <p className="max-w-[180px] truncate text-xs font-semibold">{flag.label || config.label}</p>
                                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/80">{isSigned ? "Signed" : `Flag ${index + 1}`}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {placementMode ? (
                        <button
                          type="button"
                          className="absolute inset-0 z-20 cursor-crosshair bg-transparent"
                          onClick={handleFlagPlacement}
                          aria-label="Place signature flag"
                        />
                      ) : null}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex min-h-[820px] flex-col gap-5">
              <Card className="border-slate-200 shadow-none">
                <CardHeader className="border-b border-slate-200 bg-slate-950 pb-4 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center text-white">
                        <Video className="mr-2 h-5 w-5 text-sky-300" />
                        Live room
                      </CardTitle>
                      <CardDescription className="text-slate-300">Call stays beside the signing rail. Useful, optional, and notably less annoying than shared cursors.</CardDescription>
                    </div>
                    <Badge variant="outline" className="rounded-full border px-3 py-1 text-xs font-medium border-slate-700 bg-slate-900 text-slate-100">
                      {status === "idle" ? "Call ready" : status === "joining" ? "Joining" : status === "joined" ? "Live" : "Leaving"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-5">
                  <Alert className="border-slate-200 bg-slate-50">
                    <AlertTitle>Agora status</AlertTitle>
                    <AlertDescription>{statusMessage}</AlertDescription>
                  </Alert>
                  {errorMessage ? <Alert variant="destructive"><AlertTitle>Call error</AlertTitle><AlertDescription>{errorMessage}</AlertDescription></Alert> : null}

                  <div className="rounded-[28px] bg-[radial-gradient(circle_at_top,#1e293b_0%,#0f172a_72%)] p-4 text-white shadow-[0_20px_60px_rgba(15,23,42,0.24)]">
                    <div className="mb-3 flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-slate-300">
                      <span>Camera</span>
                      <span>{isJoined ? "Live" : "Preview"}</span>
                    </div>
                    <div ref={localVideoContainerRef} className="h-64 rounded-[22px] bg-slate-900 sm:h-72" />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button onClick={() => void joinCall()} disabled={isJoined || isBusy} className="h-11">
                      {status === "joining" ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                      Join call
                    </Button>
                    <Button variant="outline" onClick={() => void leaveCall()} disabled={!isJoined || isBusy} className="h-11 border-slate-300">
                      <PhoneOff className="mr-2 h-4 w-4" />
                      Leave
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

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Remote participants</p>
                      <Badge variant="outline" className="border-slate-300 text-slate-600">{remoteParticipants.length} connected</Badge>
                    </div>
                    <div className="grid gap-3">
                      {remoteParticipants.length ? remoteParticipants.map((participant) => (
                        <div key={participant.uid} className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                            <span>{participant.uid}</span>
                            <span>{participant.hasAudio ? "Audio on" : "Audio off"} · {participant.hasVideo ? "Video on" : "Video off"}</span>
                          </div>
                          <div ref={(element) => { remoteVideoRefs.current[participant.uid] = element; }} className="h-40 rounded-xl bg-slate-100" />
                        </div>
                      )) : <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">No one else has joined yet.</div>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none">
                <CardHeader className="border-b border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_100%)] pb-4">
                  <CardTitle className="flex items-center text-slate-950">
                    <ShieldCheck className="mr-2 h-5 w-5 text-sky-600" />
                    Signature status
                  </CardTitle>
                  <CardDescription>Simple session-level overview of what still needs a signature and what has already been completed.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Flags</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-950">{signatureFlags.length}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Signed</p>
                      <p className="mt-2 text-3xl font-semibold text-emerald-700">{signedCount}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Pending</p>
                      <p className="mt-2 text-3xl font-semibold text-amber-700">{pendingCount}</p>
                    </div>
                  </div>

                  <ScrollArea className="h-[280px] rounded-2xl border border-slate-200 bg-white">
                    <div className="space-y-3 p-4">
                      {signatureFlags.length ? signatureFlags.map((flag, index) => {
                        const config = flagTypeConfig[flag.flagType];
                        const isSigned = Boolean(flag.signedAt);

                        return (
                          <button
                            key={flag.id}
                            type="button"
                            className={cn(
                              "w-full rounded-2xl border px-4 py-4 text-left transition",
                              selectedFlagId === flag.id ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white hover:border-slate-300",
                            )}
                            onClick={() => setSelectedFlagId(flag.id)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: isSigned ? "#15803d" : config.accent }}>
                                    {index + 1}
                                  </span>
                                  <p className="text-sm font-semibold text-slate-950">{flag.label || config.label}</p>
                                  <Badge variant="outline" className={config.badge}>{config.shortLabel}</Badge>
                                  <Badge variant="outline" className={isSigned ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
                                    {isSigned ? "Signed" : "Pending"}
                                  </Badge>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                  <span>Placed by {flag.createdByName}</span>
                                  <span>{formatTimelineTimestamp(flag.createdAt)}</span>
                                  <span>{flag.xPercent.toFixed(1)}%, {flag.yPercent.toFixed(1)}%</span>
                                  {flag.signedAt ? <span>Signed by {flag.signedByName}</span> : null}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      }) : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No signature flags yet. Turn on placement mode and click the PDF.</div>}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Tabs defaultValue="sign" className="flex min-h-0 flex-1 flex-col">
                <TabsList className="grid w-full grid-cols-3 bg-slate-100">
                  <TabsTrigger value="sign"><FileSignature className="mr-2 h-4 w-4" />Sign</TabsTrigger>
                  <TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4" />Chat</TabsTrigger>
                  <TabsTrigger value="session"><FileSignature className="mr-2 h-4 w-4" />Session</TabsTrigger>
                </TabsList>

                <TabsContent value="sign" className="mt-4 flex-1">
                  <Card className="flex h-full flex-col border-slate-200 shadow-none">
                    <CardHeader className="border-b border-slate-200 bg-slate-50 pb-4">
                      <CardTitle className="text-slate-950">Flag details and signing</CardTitle>
                      <CardDescription>Pick a flag, review what it is for, then capture a typed signature as the MVP.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-5">
                      {selectedFlag ? (
                        <>
                          <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-lg font-semibold text-slate-950">{selectedFlag.label || flagTypeConfig[selectedFlag.flagType].label}</p>
                                  <Badge variant="outline" className={flagTypeConfig[selectedFlag.flagType].badge}>{flagTypeConfig[selectedFlag.flagType].label}</Badge>
                                  <Badge variant="outline" className={selectedFlag.signedAt ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
                                    {selectedFlag.signedAt ? "Signed" : "Awaiting signature"}
                                  </Badge>
                                </div>
                                <p className="mt-2 text-sm text-slate-500">Placed by {selectedFlag.createdByName} · {formatTimelineTimestamp(selectedFlag.createdAt)}</p>
                              </div>
                              <Button variant="outline" size="sm" className="border-slate-300" onClick={() => void handleDeleteFlag(selectedFlag.id)}>
                                Delete flag
                              </Button>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Position</p>
                                <p className="mt-2 text-sm font-medium text-slate-950">{selectedFlag.xPercent.toFixed(1)}%, {selectedFlag.yPercent.toFixed(1)}%</p>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Document match</p>
                                <p className="mt-2 truncate text-sm font-medium text-slate-950">{documentRecord?.originalFilename || "Current session PDF"}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">Signature form</p>
                              <p className="text-sm text-slate-500">This MVP stores signer name, typed signature text, timestamp, and an optional note on the flag itself.</p>
                            </div>
                            <Input
                              value={signDraft.signerName}
                              onChange={(event) => setSignDraft((current) => ({ ...current, signerName: event.target.value }))}
                              placeholder="Signer name"
                              className="border-slate-300"
                            />
                            <Input
                              value={signDraft.signatureText}
                              onChange={(event) => setSignDraft((current) => ({ ...current, signatureText: event.target.value }))}
                              placeholder="Typed signature"
                              className="border-slate-300"
                            />
                            <Textarea
                              value={signDraft.note}
                              onChange={(event) => setSignDraft((current) => ({ ...current, note: event.target.value }))}
                              placeholder="Optional note, title, or clarification"
                              className="min-h-[100px] border-slate-200"
                            />
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="text-xs text-slate-500">
                                {selectedFlag.signedAt ? `Currently signed by ${selectedFlag.signedByName} on ${formatTimelineTimestamp(selectedFlag.signedAt)}` : "Unsigned flag. Save to capture the signature."}
                              </div>
                              <div className="flex items-center gap-2">
                                {selectedFlag.signedAt ? <Button type="button" variant="outline" className="border-slate-300" onClick={() => void handleClearSignature()}>Clear</Button> : null}
                                <Button type="button" onClick={() => void handleSaveSignature()} disabled={isSavingFlag}>
                                  {isSavingFlag ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                  {selectedFlag.signedAt ? "Update signature" : "Save signature"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                          Select a signature flag from the document or the status list.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="chat" className="mt-4 flex-1">
                  <Card className="flex h-full flex-col border-slate-200 shadow-none">
                    <CardHeader className="border-b border-slate-200 bg-slate-50 pb-4">
                      <CardTitle className="text-slate-950">Chat</CardTitle>
                      <CardDescription>Room-level chat still works for coordinating the signing session.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-5">
                      <form
                        className="space-y-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void handleCreateComment({
                            body: sessionReplyParentId ? sessionReplyDraft : sessionNoteDraft,
                            parentId: sessionReplyParentId,
                            onSuccess: () => {
                              setSessionNoteDraft("");
                              setSessionReplyDraft("");
                              setSessionReplyParentId(null);
                            },
                          });
                        }}
                      >
                        <Textarea
                          value={sessionReplyParentId ? sessionReplyDraft : sessionNoteDraft}
                          onChange={(event) => sessionReplyParentId ? setSessionReplyDraft(event.target.value) : setSessionNoteDraft(event.target.value)}
                          placeholder={sessionReplyParentId ? "Reply in chat..." : "Send a message to everyone in this signing session..."}
                          className="min-h-[100px] border-slate-200 bg-white"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-slate-500">Messages remain shared across everyone on the session link.</p>
                          <div className="flex items-center gap-2">
                            {sessionReplyParentId ? <Button type="button" variant="ghost" className="text-slate-500" onClick={() => { setSessionReplyParentId(null); setSessionReplyDraft(""); }}>Clear reply target</Button> : null}
                            <Button type="submit" disabled={!(sessionReplyParentId ? sessionReplyDraft : sessionNoteDraft).trim()}>
                              <Send className="mr-2 h-4 w-4" />
                              Send message
                            </Button>
                          </div>
                        </div>
                      </form>
                      <ScrollArea className="h-[420px] rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        {sessionChat.length ? (
                          <ThreadList
                            comments={sessionChat}
                            replyDraft={sessionReplyDraft}
                            replyParentId={sessionReplyParentId}
                            setReplyDraft={setSessionReplyDraft}
                            setReplyParentId={setSessionReplyParentId}
                            onSubmitReply={(parentId) => handleCreateComment({
                              body: sessionReplyDraft,
                              parentId,
                              onSuccess: () => {
                                setSessionReplyDraft("");
                                setSessionReplyParentId(null);
                              },
                            })}
                            onDeleteComment={handleDeleteComment}
                          />
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">No chat messages yet.</div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="session" className="mt-4 flex-1">
                  <Card className="h-full border-slate-200 shadow-none">
                    <CardHeader className="border-b border-slate-200 bg-slate-50 pb-4">
                      <CardTitle className="text-slate-950">Session controls</CardTitle>
                      <CardDescription>Session identity, sharing controls, and signer identity for the current workspace.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-5">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700" htmlFor="workspace-participant-name">Your display name</label>
                        <Input id="workspace-participant-name" value={participantName} onChange={(event) => setParticipantName(event.target.value)} placeholder="Name shown in signatures and chat" />
                      </div>
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
                          <Copy className="mr-2 h-4 w-4" />
                          Copy link
                        </Button>
                        <Button type="button" variant="outline" className="border-slate-300" onClick={handleNewSession} disabled={isBusy || isUploading}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          New session
                        </Button>
                        <Button type="button" onClick={() => void applySessionDetails()} disabled={isBusy || isUploading}>
                          <Save className="mr-2 h-4 w-4" />
                          Save session
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

                      <div className="grid gap-3 text-sm text-slate-700">
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
                          <p className="font-medium text-slate-950">How this room works</p>
                          <p className="mt-2">The PDF stays shared by session. Signature flags are persisted per session/document, and each flag stores its current signature state directly so the workflow stays simple and reliable.</p>
                        </div>
                      </div>
                      {sessionError ? (
                        <Alert variant="destructive">
                          <AlertTitle>Session error</AlertTitle>
                          <AlertDescription>{sessionError}</AlertDescription>
                        </Alert>
                      ) : null}
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
