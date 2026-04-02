import { ChangeEvent, DragEvent, FormEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
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
  FileBadge2,
  FileText,
  Link2,
  Loader2,
  MessageSquare,
  MessageSquareReply,
  Mic,
  MicOff,
  MousePointer2,
  PenLine,
  Phone,
  PhoneOff,
  Radio,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
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
const PARTICIPANT_ID_STORAGE_KEY = "pdf-collab-participant-id";
const PARTICIPANT_NAME_STORAGE_KEY = "pdf-collab-participant-name";
const CURSOR_BROADCAST_INTERVAL_MS = 80;
const PARTICIPANT_COLORS = ["#0f766e", "#2563eb", "#c2410c", "#7c3aed", "#be123c", "#059669"];

const statusStyles = {
  idle: "border-slate-200 bg-slate-50 text-slate-700",
  joining: "border-sky-200 bg-sky-50 text-sky-700",
  joined: "border-emerald-200 bg-emerald-50 text-emerald-700",
  leaving: "border-amber-200 bg-amber-50 text-amber-700",
} as const;

const annotationTypeConfig = {
  comment: { label: "Comment", marker: "C", badge: "border-slate-200 bg-slate-50 text-slate-700" },
  question: { label: "Question", marker: "?", badge: "border-sky-200 bg-sky-50 text-sky-700" },
  issue: { label: "Issue", marker: "!", badge: "border-rose-200 bg-rose-50 text-rose-700" },
  approval: { label: "Approval", marker: "OK", badge: "border-emerald-200 bg-emerald-50 text-emerald-700" },
} as const;

const annotationStatusConfig = {
  open: { label: "Open", badge: "border-slate-200 bg-slate-50 text-slate-700" },
  in_review: { label: "In review", badge: "border-amber-200 bg-amber-50 text-amber-700" },
  resolved: { label: "Resolved", badge: "border-emerald-200 bg-emerald-50 text-emerald-700" },
} as const;

const annotationPriorityConfig = {
  low: { label: "Low", badge: "border-slate-200 bg-slate-50 text-slate-700" },
  normal: { label: "Normal", badge: "border-sky-200 bg-sky-50 text-sky-700" },
  high: { label: "High", badge: "border-orange-200 bg-orange-50 text-orange-700" },
  urgent: { label: "Urgent", badge: "border-rose-200 bg-rose-50 text-rose-700" },
} as const;

type AnnotationType = keyof typeof annotationTypeConfig;
type AnnotationStatus = keyof typeof annotationStatusConfig;
type AnnotationPriority = keyof typeof annotationPriorityConfig;

type SessionDocument = {
  sessionId: string;
  sessionName: string;
  storagePath: string | null;
  publicUrl: string | null;
  originalFilename: string | null;
  fileSize: number | null;
  uploadedAt: string | null;
};

type WorkspacePresence = {
  id: string;
  name: string;
  color: string;
  cursor: { xPercent: number; yPercent: number } | null;
  isSelf: boolean;
};

type AnnotationRecord = {
  id: string;
  sessionId: string;
  authorId: string;
  authorName: string;
  color: string;
  title: string | null;
  body: string | null;
  annotationType: AnnotationType;
  status: AnnotationStatus;
  priority: AnnotationPriority;
  xPercent: number;
  yPercent: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
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

type AnnotationComposerState = {
  title: string;
  body: string;
  annotationType: AnnotationType;
  status: AnnotationStatus;
  priority: AnnotationPriority;
};

const defaultAnnotationComposer = (): AnnotationComposerState => ({
  title: "",
  body: "",
  annotationType: "comment",
  status: "open",
  priority: "normal",
});

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

const getStoredParticipantId = () => {
  if (typeof window === "undefined") {
    return "reviewer";
  }

  const existingId = window.localStorage.getItem(PARTICIPANT_ID_STORAGE_KEY);
  if (existingId) {
    return existingId;
  }

  const nextId = `reviewer-${createSessionId()}`;
  window.localStorage.setItem(PARTICIPANT_ID_STORAGE_KEY, nextId);
  return nextId;
};

const getStoredParticipantName = () => {
  if (typeof window === "undefined") {
    return "Reviewer";
  }

  const existingName = window.localStorage.getItem(PARTICIPANT_NAME_STORAGE_KEY);
  return existingName?.trim() || `Reviewer ${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
};

const getParticipantColor = (seed: string) => {
  const hash = seed.split("").reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0);
  return PARTICIPANT_COLORS[hash % PARTICIPANT_COLORS.length];
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "RV";

const normalizeAnnotationRecord = (annotation: Record<string, string | number | null>): AnnotationRecord => ({
  id: String(annotation.id),
  sessionId: String(annotation.session_id),
  authorId: String(annotation.author_id),
  authorName: String(annotation.author_name),
  color: String(annotation.color),
  title: (annotation.title as string | null) ?? null,
  body: (annotation.body as string | null) ?? null,
  annotationType: ((annotation.annotation_type as AnnotationType | null) ?? "comment"),
  status: ((annotation.status as AnnotationStatus | null) ?? "open"),
  priority: ((annotation.priority as AnnotationPriority | null) ?? "normal"),
  xPercent: Number(annotation.x_percent),
  yPercent: Number(annotation.y_percent),
  createdAt: String(annotation.created_at),
  updatedAt: String(annotation.updated_at ?? annotation.created_at),
  resolvedAt: (annotation.resolved_at as string | null) ?? null,
});

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

  const renderBranch = (parentId: string | null, depth: number) =>
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
                  {comment.updatedAt !== comment.createdAt ? <Badge variant="outline" className="border-slate-200 text-[11px] text-slate-500">Edited</Badge> : null}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.body}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-500" onClick={() => { setReplyParentId(comment.id); setReplyDraft(""); }}>
                <MessageSquareReply className="mr-1 h-3.5 w-3.5" />
                Reply
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-500" onClick={() => void onDeleteComment(comment.id)}>
                <Trash2 className="h-3.5 w-3.5" />
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
                <Button type="button" variant="ghost" className="text-slate-500" onClick={() => { setReplyParentId(null); setReplyDraft(""); }}>
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
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const cursorSentAtRef = useRef(0);
  const cursorTimeoutRef = useRef<number | null>(null);
  const pendingCursorRef = useRef<{ xPercent: number; yPercent: number } | null>(null);
  const localParticipantId = useRef(getStoredParticipantId());

  const [isDragging, setIsDragging] = useState(false);
  const [sessionIdInput, setSessionIdInput] = useState(resolvedSession.sessionId);
  const [sessionNameInput, setSessionNameInput] = useState(resolvedSession.sessionName);
  const [participantName, setParticipantName] = useState(getStoredParticipantName);
  const [documentRecord, setDocumentRecord] = useState<SessionDocument | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [presenceParticipants, setPresenceParticipants] = useState<WorkspacePresence[]>([]);
  const [annotations, setAnnotations] = useState<AnnotationRecord[]>([]);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [interactionMode, setInteractionMode] = useState<"navigate" | "annotate">("navigate");
  const [annotationComposer, setAnnotationComposer] = useState<AnnotationComposerState>(defaultAnnotationComposer);
  const [selectedAnnotationDraft, setSelectedAnnotationDraft] = useState<AnnotationComposerState>(defaultAnnotationComposer);
  const [sessionNoteDraft, setSessionNoteDraft] = useState("");
  const [annotationReplyDraft, setAnnotationReplyDraft] = useState("");
  const [annotationReplyParentId, setAnnotationReplyParentId] = useState<string | null>(null);
  const [sessionReplyDraft, setSessionReplyDraft] = useState("");
  const [sessionReplyParentId, setSessionReplyParentId] = useState<string | null>(null);
  const [isPresenceReady, setIsPresenceReady] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingAnnotation, setIsSavingAnnotation] = useState(false);
  const [sessionError, setSessionError] = useState("");
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
    readyMessage: "Ready to bring reviewers into the room. Share the invite link so they land in the same PDF session and Agora channel.",
    joinedMessage: (channel) => `Connected to "${channel}". Everyone on the shared session link joins this same call room.`,
    leftMessage: "Call ended. The shared PDF session is still live, and you can rejoin whenever you need.",
  });

  const localParticipantColor = useMemo(() => getParticipantColor(localParticipantId.current), []);
  const selectedAnnotation = useMemo(
    () => annotations.find((annotation) => annotation.id === selectedAnnotationId) ?? null,
    [annotations, selectedAnnotationId],
  );
  const otherParticipants = useMemo(
    () => presenceParticipants.filter((participant) => !participant.isSelf),
    [presenceParticipants],
  );
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
  const annotationComments = useMemo(
    () => comments.filter((comment) => comment.annotationId === selectedAnnotationId),
    [comments, selectedAnnotationId],
  );
  const sessionNotes = useMemo(
    () => comments.filter((comment) => comment.annotationId === null),
    [comments],
  );
  const annotationCommentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    comments.forEach((comment) => {
      if (!comment.annotationId) {
        return;
      }
      counts.set(comment.annotationId, (counts.get(comment.annotationId) ?? 0) + 1);
    });
    return counts;
  }, [comments]);
  const annotationSummary = useMemo(() => {
    const summary = {
      open: 0,
      inReview: 0,
      resolved: 0,
      urgent: 0,
    };

    annotations.forEach((annotation) => {
      if (annotation.status === "open") summary.open += 1;
      if (annotation.status === "in_review") summary.inReview += 1;
      if (annotation.status === "resolved") summary.resolved += 1;
      if (annotation.priority === "urgent") summary.urgent += 1;
    });

    return summary;
  }, [annotations]);

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
    window.localStorage.setItem(PARTICIPANT_NAME_STORAGE_KEY, participantName.trim() || "Reviewer");
  }, [participantName]);

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
    setAnnotations([]);
    setComments([]);
    setSelectedAnnotationId(null);
    setSelectedAnnotationDraft(defaultAnnotationComposer());
    setAnnotationReplyDraft("");
    setAnnotationReplyParentId(null);
    setSessionReplyDraft("");
    setSessionReplyParentId(null);

    let isMounted = true;

    const loadReviewState = async () => {
      const [{ data: annotationData, error: annotationError }, { data: commentData, error: commentError }] = await Promise.all([
        supabase
          .from("pdf_collab_annotations")
          .select("id, session_id, author_id, author_name, color, title, body, annotation_type, status, priority, x_percent, y_percent, created_at, updated_at, resolved_at")
          .eq("session_id", resolvedSession.sessionId)
          .order("created_at", { ascending: true }),
        supabase
          .from("pdf_collab_comments")
          .select("id, session_id, annotation_id, parent_id, author_id, author_name, color, body, created_at, updated_at")
          .eq("session_id", resolvedSession.sessionId)
          .order("created_at", { ascending: true }),
      ]);

      if (!isMounted) {
        return;
      }

      if (!annotationError) {
        setAnnotations((annotationData || []).map((annotation) => normalizeAnnotationRecord(annotation as unknown as Record<string, string | number | null>)));
      }

      if (!commentError) {
        setComments((commentData || []).map((comment) => normalizeCommentRecord(comment as unknown as Record<string, string | null>)));
      }
    };

    void loadReviewState();

    return () => {
      isMounted = false;
    };
  }, [resolvedSession.sessionId]);

  useEffect(() => {
    if (!selectedAnnotation) {
      setSelectedAnnotationDraft(defaultAnnotationComposer());
      return;
    }

    setSelectedAnnotationDraft({
      title: selectedAnnotation.title ?? "",
      body: selectedAnnotation.body ?? "",
      annotationType: selectedAnnotation.annotationType,
      status: selectedAnnotation.status,
      priority: selectedAnnotation.priority,
    });
  }, [selectedAnnotation]);

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

  useEffect(() => {
    const syncPresenceState = () => {
      const channel = presenceChannelRef.current;
      if (!channel) {
        return;
      }

      const state = channel.presenceState<{
        id: string;
        name: string;
        color: string;
        cursor: { xPercent: number; yPercent: number } | null;
      }>();

      const nextParticipants = Object.values(state)
        .flat()
        .map((participant) => ({
          id: participant.id,
          name: participant.name,
          color: participant.color,
          cursor: participant.cursor,
          isSelf: participant.id === localParticipantId.current,
        }))
        .sort((left, right) => Number(right.isSelf) - Number(left.isSelf) || left.name.localeCompare(right.name));

      setPresenceParticipants(nextParticipants);
    };

    const channel = supabase.channel(`pdf-collab:${resolvedSession.sessionId}`, {
      config: {
        presence: {
          key: localParticipantId.current,
        },
      },
    });

    const upsertAnnotation = (record: AnnotationRecord) => {
      setAnnotations((current) => {
        const existingIndex = current.findIndex((annotation) => annotation.id === record.id);
        if (existingIndex === -1) {
          return [...current, record].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
        }

        const next = [...current];
        next[existingIndex] = record;
        return next;
      });
    };

    const upsertComment = (record: CommentRecord) => {
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

    presenceChannelRef.current = channel;
    setIsPresenceReady(false);

    channel
      .on("presence", { event: "sync" }, syncPresenceState)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pdf_collab_sessions",
          filter: `session_id=eq.${resolvedSession.sessionId}`,
        },
        (payload) => {
          const nextRecord = payload.new as Record<string, string | number | null>;
          if (!nextRecord?.session_id) {
            return;
          }

          setDocumentRecord({
            sessionId: String(nextRecord.session_id),
            sessionName: String(nextRecord.session_name),
            storagePath: (nextRecord.storage_path as string | null) ?? null,
            publicUrl: (nextRecord.public_url as string | null) ?? null,
            originalFilename: (nextRecord.original_filename as string | null) ?? null,
            fileSize: (nextRecord.file_size as number | null) ?? null,
            uploadedAt: (nextRecord.uploaded_at as string | null) ?? null,
          });
          setViewerUrl((nextRecord.public_url as string | null) ?? null);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pdf_collab_annotations",
          filter: `session_id=eq.${resolvedSession.sessionId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            upsertAnnotation(normalizeAnnotationRecord(payload.new as Record<string, string | number | null>));
            return;
          }

          if (payload.eventType === "DELETE") {
            const previous = payload.old as Record<string, string | null>;
            setAnnotations((current) => current.filter((annotation) => annotation.id !== previous.id));
            setSelectedAnnotationId((current) => (current === previous.id ? null : current));
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pdf_collab_comments",
          filter: `session_id=eq.${resolvedSession.sessionId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            upsertComment(normalizeCommentRecord(payload.new as Record<string, string | null>));
            return;
          }

          if (payload.eventType === "DELETE") {
            const previous = payload.old as Record<string, string | null>;
            setComments((current) => current.filter((comment) => comment.id !== previous.id));
          }
        },
      )
      .subscribe(async (subscriptionStatus) => {
        if (subscriptionStatus !== "SUBSCRIBED") {
          return;
        }

        setIsPresenceReady(true);
        await channel.track({
          id: localParticipantId.current,
          name: participantName.trim() || "Reviewer",
          color: localParticipantColor,
          cursor: null,
        });
      });

    return () => {
      if (cursorTimeoutRef.current) {
        window.clearTimeout(cursorTimeoutRef.current);
        cursorTimeoutRef.current = null;
      }

      setPresenceParticipants([]);
      setIsPresenceReady(false);
      presenceChannelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [localParticipantColor, participantName, resolvedSession.sessionId]);

  useEffect(() => {
    const channel = presenceChannelRef.current;
    if (!channel || !isPresenceReady) {
      return;
    }

    void channel.track({
      id: localParticipantId.current,
      name: participantName.trim() || "Reviewer",
      color: localParticipantColor,
      cursor: null,
    });
  }, [isPresenceReady, localParticipantColor, participantName]);

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

  const trackCursor = async (cursor: { xPercent: number; yPercent: number } | null) => {
    const channel = presenceChannelRef.current;
    if (!channel || !isPresenceReady) {
      return;
    }

    await channel.track({
      id: localParticipantId.current,
      name: participantName.trim() || "Reviewer",
      color: localParticipantColor,
      cursor,
    });
  };

  const flushPendingCursor = () => {
    if (!pendingCursorRef.current) {
      return;
    }

    const nextCursor = pendingCursorRef.current;
    pendingCursorRef.current = null;
    cursorSentAtRef.current = Date.now();
    void trackCursor(nextCursor);
  };

  const scheduleCursorBroadcast = (cursor: { xPercent: number; yPercent: number } | null) => {
    if (cursor === null) {
      pendingCursorRef.current = null;
      cursorSentAtRef.current = Date.now();
      void trackCursor(null);
      return;
    }

    const elapsed = Date.now() - cursorSentAtRef.current;
    if (elapsed >= CURSOR_BROADCAST_INTERVAL_MS) {
      cursorSentAtRef.current = Date.now();
      pendingCursorRef.current = null;
      void trackCursor(cursor);
      return;
    }

    pendingCursorRef.current = cursor;
    if (cursorTimeoutRef.current) {
      return;
    }

    cursorTimeoutRef.current = window.setTimeout(() => {
      cursorTimeoutRef.current = null;
      flushPendingCursor();
    }, CURSOR_BROADCAST_INTERVAL_MS - elapsed);
  };

  const handleWorkspacePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!documentRecord?.publicUrl || interactionMode === "annotate") {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) {
      return;
    }

    const xPercent = Number((((event.clientX - bounds.left) / bounds.width) * 100).toFixed(2));
    const yPercent = Number((((event.clientY - bounds.top) / bounds.height) * 100).toFixed(2));
    scheduleCursorBroadcast({ xPercent, yPercent });
  };

  const handleWorkspacePointerLeave = () => {
    scheduleCursorBroadcast(null);
  };

  const handleAnnotationPlacement = async (event: ReactMouseEvent<HTMLElement>) => {
    if (interactionMode !== "annotate" || !documentRecord?.publicUrl) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const xPercent = Number((((event.clientX - bounds.left) / bounds.width) * 100).toFixed(2));
    const yPercent = Number((((event.clientY - bounds.top) / bounds.height) * 100).toFixed(2));

    await ensureCurrentSessionRecord();

    const { data, error } = await supabase
      .from("pdf_collab_annotations")
      .insert({
        session_id: resolvedSession.sessionId,
        author_id: localParticipantId.current,
        author_name: participantName.trim() || "Reviewer",
        color: localParticipantColor,
        title: annotationComposer.title.trim() || null,
        body: annotationComposer.body.trim() || null,
        annotation_type: annotationComposer.annotationType,
        status: annotationComposer.status,
        priority: annotationComposer.priority,
        x_percent: xPercent,
        y_percent: yPercent,
      })
      .select("id, session_id, author_id, author_name, color, title, body, annotation_type, status, priority, x_percent, y_percent, created_at, updated_at, resolved_at")
      .single();

    if (error) {
      toast({
        title: "Markup not added",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const nextAnnotation = normalizeAnnotationRecord(data as unknown as Record<string, string | number | null>);
    setAnnotations((current) => (current.some((annotation) => annotation.id === nextAnnotation.id) ? current : [...current, nextAnnotation]));
    setSelectedAnnotationId(nextAnnotation.id);
    setInteractionMode("navigate");
    setAnnotationComposer(defaultAnnotationComposer());
  };

  const handleSaveSelectedAnnotation = async () => {
    if (!selectedAnnotation) {
      return;
    }

    setIsSavingAnnotation(true);
    const { data, error } = await supabase
      .from("pdf_collab_annotations")
      .update({
        title: selectedAnnotationDraft.title.trim() || null,
        body: selectedAnnotationDraft.body.trim() || null,
        annotation_type: selectedAnnotationDraft.annotationType,
        status: selectedAnnotationDraft.status,
        priority: selectedAnnotationDraft.priority,
      })
      .eq("id", selectedAnnotation.id)
      .select("id, session_id, author_id, author_name, color, title, body, annotation_type, status, priority, x_percent, y_percent, created_at, updated_at, resolved_at")
      .single();

    setIsSavingAnnotation(false);

    if (error) {
      toast({
        title: "Review card not saved",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const nextAnnotation = normalizeAnnotationRecord(data as unknown as Record<string, string | number | null>);
    setAnnotations((current) => current.map((annotation) => (annotation.id === nextAnnotation.id ? nextAnnotation : annotation)));
    toast({
      title: "Review card updated",
      description: "Status, priority, and notes now sync for the session.",
    });
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    const { error } = await supabase.from("pdf_collab_annotations").delete().eq("id", annotationId);

    if (error) {
      toast({
        title: "Could not delete markup",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setAnnotations((current) => current.filter((annotation) => annotation.id !== annotationId));
    setSelectedAnnotationId((current) => (current === annotationId ? null : current));
  };

  const handleCreateComment = async (options: { body: string; annotationId?: string | null; parentId?: string | null; onSuccess?: () => void }) => {
    const body = options.body.trim();
    if (!body) {
      return;
    }

    await ensureCurrentSessionRecord();

    const { error } = await supabase.from("pdf_collab_comments").insert({
      session_id: resolvedSession.sessionId,
      annotation_id: options.annotationId ?? null,
      parent_id: options.parentId ?? null,
      author_id: localParticipantId.current,
      author_name: participantName.trim() || "Reviewer",
      color: localParticipantColor,
      body,
    });

    if (error) {
      toast({
        title: "Comment not sent",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    options.onSuccess?.();
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase.from("pdf_collab_comments").delete().eq("id", commentId);

    if (error) {
      toast({
        title: "Comment not removed",
        description: error.message,
        variant: "destructive",
      });
    }
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
    setAnnotations([]);
    setComments([]);
    setSelectedAnnotationId(null);
    setSearchParams(buildSessionSearchParams(nextSessionId, nextSessionName, token.trim()));
    toast({ title: "New session created", description: `Room ${nextSessionId} is ready for a new document.` });
  };

  const callPath = buildCallSessionPath(resolvedSession.sessionId, resolvedSession.sessionName, token.trim());
  const invitePath = buildPdfSessionPath(resolvedSession.sessionId, resolvedSession.sessionName, token.trim());

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_22%,#ffffff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-5">
        <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.10)]">
          <div className="flex flex-col gap-5 border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,#1e3a8a_0%,#0f172a_58%,#020617_100%)] px-6 py-5 text-white xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">Collaborative PDF review</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Review the document, keep the call live, and work the thread like a real review room</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Shared PDF, live cursors, Agora video, richer review cards, and synced session notes all stay on the same session key.
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

          <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.65fr)_440px]">
            <Card className="overflow-hidden border-slate-200 shadow-none">
              <CardHeader className="border-b border-slate-200 bg-slate-50">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle className="text-slate-950">Document viewer</CardTitle>
                    <CardDescription>Shared review markers, threaded responses, and collaborator presence stay pinned to the same PDF surface.</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                      <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                      {annotations.length} review item{annotations.length === 1 ? "" : "s"}
                    </div>
                    {presenceParticipants.slice(0, 4).map((participant) => (
                      <div key={participant.id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: participant.color }} />
                        <span className="max-w-24 truncate">{participant.isSelf ? `${participant.name} (You)` : participant.name}</span>
                      </div>
                    ))}
                    {documentRecord?.publicUrl ? (
                      <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Shared
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
                    <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-4">
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-950">{documentRecord.originalFilename}</p>
                          <p className="text-xs text-slate-500">{metadata?.size} · Shared in session {resolvedSession.sessionId}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="border-slate-300 text-slate-600">
                            {otherParticipants.length} collaborator{otherParticipants.length === 1 ? "" : "s"} live
                          </Badge>
                          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">EmbedPDF viewer</div>
                        </div>
                      </div>
                      <div className="grid gap-3 xl:grid-cols-[auto,1fr]">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant={interactionMode === "navigate" ? "default" : "outline"}
                            className={cn(interactionMode === "navigate" ? "" : "border-slate-300")}
                            onClick={() => setInteractionMode("navigate")}
                          >
                            <MousePointer2 className="mr-2 h-4 w-4" />
                            Navigate
                          </Button>
                          <Button
                            type="button"
                            variant={interactionMode === "annotate" ? "default" : "outline"}
                            className={cn(interactionMode === "annotate" ? "" : "border-slate-300")}
                            onClick={() => setInteractionMode("annotate")}
                          >
                            <PenLine className="mr-2 h-4 w-4" />
                            Drop review card
                          </Button>
                        </div>
                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr),150px,150px,150px]">
                          <Input
                            value={annotationComposer.title}
                            onChange={(event) => setAnnotationComposer((current) => ({ ...current, title: event.target.value }))}
                            placeholder="Review card title"
                          />
                          <Select value={annotationComposer.annotationType} onValueChange={(value: AnnotationType) => setAnnotationComposer((current) => ({ ...current, annotationType: value }))}>
                            <SelectTrigger className="border-slate-300 bg-white">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(annotationTypeConfig).map(([value, config]) => (
                                <SelectItem key={value} value={value}>{config.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={annotationComposer.status} onValueChange={(value: AnnotationStatus) => setAnnotationComposer((current) => ({ ...current, status: value }))}>
                            <SelectTrigger className="border-slate-300 bg-white">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(annotationStatusConfig).map(([value, config]) => (
                                <SelectItem key={value} value={value}>{config.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={annotationComposer.priority} onValueChange={(value: AnnotationPriority) => setAnnotationComposer((current) => ({ ...current, priority: value }))}>
                            <SelectTrigger className="border-slate-300 bg-white">
                              <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(annotationPriorityConfig).map(([value, config]) => (
                                <SelectItem key={value} value={value}>{config.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Textarea
                        value={annotationComposer.body}
                        onChange={(event) => setAnnotationComposer((current) => ({ ...current, body: event.target.value }))}
                        placeholder="Optional detail for the next review card"
                        className="min-h-[84px] border-slate-200 bg-slate-50"
                      />
                    </div>
                    <div className="relative h-[980px] w-full overflow-hidden bg-white" onPointerMove={handleWorkspacePointerMove} onPointerLeave={handleWorkspacePointerLeave}>
                      <div ref={viewerHostRef} className="h-full w-full bg-white" />
                      <div className="pointer-events-none absolute inset-0 z-10">
                        {annotations.map((annotation, index) => {
                          const typeConfig = annotationTypeConfig[annotation.annotationType];
                          const statusConfig = annotationStatusConfig[annotation.status];

                          return (
                            <button
                              key={annotation.id}
                              type="button"
                              className={cn(
                                "pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-[20px] border-2 border-white px-2 py-1 text-left text-white shadow-[0_10px_30px_rgba(15,23,42,0.24)] transition hover:scale-[1.02]",
                                annotation.status === "resolved" ? "opacity-80" : "",
                                selectedAnnotationId === annotation.id ? "ring-4 ring-sky-100" : "",
                              )}
                              style={{
                                left: `${annotation.xPercent}%`,
                                top: `${annotation.yPercent}%`,
                                backgroundColor: annotation.color,
                              }}
                              onClick={() => setSelectedAnnotationId(annotation.id)}
                              title={annotation.title || annotation.body || `Markup ${index + 1}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-white/20 px-2 text-[11px] font-bold">{typeConfig.marker}</span>
                                <div className="min-w-0">
                                  <p className="max-w-[170px] truncate text-xs font-semibold">{annotation.title || `${typeConfig.label} ${index + 1}`}</p>
                                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/75">{statusConfig.label}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                        {otherParticipants.map((participant) =>
                          participant.cursor ? (
                            <div
                              key={participant.id}
                              className="absolute -translate-x-1/2 -translate-y-1/2"
                              style={{ left: `${participant.cursor.xPercent}%`, top: `${participant.cursor.yPercent}%` }}
                            >
                              <div className="relative">
                                <div
                                  className="h-4 w-4 rotate-[-18deg] rounded-br-full rounded-tl-sm border border-white shadow-sm"
                                  style={{ backgroundColor: participant.color }}
                                />
                                <div
                                  className="absolute left-3 top-3 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_8px_24px_rgba(15,23,42,0.2)]"
                                  style={{ backgroundColor: participant.color }}
                                >
                                  {participant.name}
                                </div>
                              </div>
                            </div>
                          ) : null,
                        )}
                      </div>
                      {interactionMode === "annotate" ? (
                        <button
                          type="button"
                          className="absolute inset-0 z-20 cursor-crosshair bg-transparent"
                          onClick={handleAnnotationPlacement}
                          aria-label="Place shared review card"
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
                      <CardDescription className="text-slate-300">Video and audio stay pinned beside the review rail while the document remains the main workspace.</CardDescription>
                    </div>
                    <Badge variant="outline" className={cn("rounded-full border px-3 py-1 text-xs font-medium", statusStyles[status])}>
                      <Radio className="mr-1.5 h-3.5 w-3.5" />
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
                    Presence roster
                  </CardTitle>
                  <CardDescription>Who is in the session, who is moving on the document, and where review attention is concentrated.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Reviewers live</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-950">{presenceParticipants.length}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Active cursors</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-950">{presenceParticipants.filter((participant) => participant.cursor).length}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {presenceParticipants.length ? presenceParticipants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-10 w-10 border border-slate-200">
                            <AvatarFallback style={{ backgroundColor: `${participant.color}20`, color: participant.color }}>
                              {getInitials(participant.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold text-slate-950">{participant.name}</p>
                              {participant.isSelf ? <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">You</Badge> : null}
                            </div>
                            <p className="text-xs text-slate-500">{participant.cursor ? `Pointer at ${participant.cursor.xPercent.toFixed(1)}%, ${participant.cursor.yPercent.toFixed(1)}%` : "Watching document"}</p>
                          </div>
                        </div>
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: participant.color }} />
                      </div>
                    )) : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Presence will appear after the realtime channel finishes joining.</div>}
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="session" className="flex min-h-0 flex-1 flex-col">
                <TabsList className="grid w-full grid-cols-3 bg-slate-100">
                  <TabsTrigger value="session"><FileBadge2 className="mr-2 h-4 w-4" />Session</TabsTrigger>
                  <TabsTrigger value="markup"><PenLine className="mr-2 h-4 w-4" />Review</TabsTrigger>
                  <TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4" />Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="session" className="mt-4 flex-1">
                  <Card className="h-full border-slate-200 shadow-none">
                    <CardHeader className="border-b border-slate-200 bg-slate-50 pb-4">
                      <CardTitle className="text-slate-950">Session controls</CardTitle>
                      <CardDescription>Session, identity, file, and sharing controls for the current workspace.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-5">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700" htmlFor="workspace-participant-name">Your display name</label>
                        <Input id="workspace-participant-name" value={participantName} onChange={(event) => setParticipantName(event.target.value)} placeholder="Reviewer name used for cursors and review threads" />
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
                          <p className="font-medium text-slate-950">Presence sync</p>
                          <p className="mt-2">Supabase Presence keeps reviewer cursors live in the active session, while sessions, review cards, and shared notes now all sync on the same <code>session_id</code>.</p>
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

                <TabsContent value="markup" className="mt-4 flex-1">
                  <Card className="flex h-full flex-col border-slate-200 shadow-none">
                    <CardHeader className="border-b border-slate-200 bg-slate-50 pb-4">
                      <CardTitle className="text-slate-950">Review queue</CardTitle>
                      <CardDescription>Typed annotation cards, status, priority, and threaded discussion all sync for the room.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-5">
                      <div className="grid gap-3 sm:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Open</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-950">{annotationSummary.open}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">In review</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-950">{annotationSummary.inReview}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Resolved</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-950">{annotationSummary.resolved}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Urgent</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-950">{annotationSummary.urgent}</p>
                        </div>
                      </div>

                      <ScrollArea className="h-[280px] rounded-2xl border border-slate-200 bg-white">
                        <div className="space-y-3 p-4">
                          {annotations.length ? annotations.map((annotation, index) => (
                            <button
                              key={annotation.id}
                              type="button"
                              className={cn(
                                "w-full rounded-2xl border px-4 py-4 text-left transition",
                                selectedAnnotationId === annotation.id ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white hover:border-slate-300",
                              )}
                              onClick={() => setSelectedAnnotationId(annotation.id)}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: annotation.color }}>
                                      {index + 1}
                                    </span>
                                    <p className="text-sm font-semibold text-slate-950">{annotation.title || `${annotationTypeConfig[annotation.annotationType].label} ${index + 1}`}</p>
                                    <Badge variant="outline" className={annotationTypeConfig[annotation.annotationType].badge}>{annotationTypeConfig[annotation.annotationType].label}</Badge>
                                    <Badge variant="outline" className={annotationStatusConfig[annotation.status].badge}>{annotationStatusConfig[annotation.status].label}</Badge>
                                    <Badge variant="outline" className={annotationPriorityConfig[annotation.priority].badge}>{annotationPriorityConfig[annotation.priority].label}</Badge>
                                  </div>
                                  <p className="mt-2 text-sm leading-6 text-slate-700">{annotation.body || "No additional detail yet."}</p>
                                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                    <span>{annotation.authorName}</span>
                                    <span>{formatTimelineTimestamp(annotation.createdAt)}</span>
                                    <span>{annotation.xPercent.toFixed(1)}%, {annotation.yPercent.toFixed(1)}%</span>
                                    <span>{annotationCommentCounts.get(annotation.id) ?? 0} comment{(annotationCommentCounts.get(annotation.id) ?? 0) === 1 ? "" : "s"}</span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          )) : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No shared review cards yet. Drop one on the PDF to start the queue.</div>}
                        </div>
                      </ScrollArea>

                      {selectedAnnotation ? (
                        <div className="flex min-h-0 flex-1 flex-col gap-4 rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-lg font-semibold text-slate-950">{selectedAnnotation.title || "Selected review card"}</p>
                              <p className="mt-1 text-sm text-slate-500">Created by {selectedAnnotation.authorName} · {formatTimelineTimestamp(selectedAnnotation.createdAt)}</p>
                            </div>
                            <Button variant="outline" size="sm" className="border-slate-300" onClick={() => void handleDeleteAnnotation(selectedAnnotation.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </div>

                          <div className="grid gap-3 md:grid-cols-3">
                            <Select value={selectedAnnotationDraft.annotationType} onValueChange={(value: AnnotationType) => setSelectedAnnotationDraft((current) => ({ ...current, annotationType: value }))}>
                              <SelectTrigger className="border-slate-300 bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(annotationTypeConfig).map(([value, config]) => (
                                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select value={selectedAnnotationDraft.status} onValueChange={(value: AnnotationStatus) => setSelectedAnnotationDraft((current) => ({ ...current, status: value }))}>
                              <SelectTrigger className="border-slate-300 bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(annotationStatusConfig).map(([value, config]) => (
                                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select value={selectedAnnotationDraft.priority} onValueChange={(value: AnnotationPriority) => setSelectedAnnotationDraft((current) => ({ ...current, priority: value }))}>
                              <SelectTrigger className="border-slate-300 bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(annotationPriorityConfig).map(([value, config]) => (
                                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <Input
                            value={selectedAnnotationDraft.title}
                            onChange={(event) => setSelectedAnnotationDraft((current) => ({ ...current, title: event.target.value }))}
                            placeholder="Review title"
                            className="border-slate-300 bg-white"
                          />
                          <Textarea
                            value={selectedAnnotationDraft.body}
                            onChange={(event) => setSelectedAnnotationDraft((current) => ({ ...current, body: event.target.value }))}
                            placeholder="What should reviewers focus on here?"
                            className="min-h-[110px] border-slate-200 bg-white"
                          />
                          <div className="flex items-center justify-end">
                            <Button onClick={() => void handleSaveSelectedAnnotation()} disabled={isSavingAnnotation}>
                              {isSavingAnnotation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                              Save review card
                            </Button>
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-950">Threaded discussion</p>
                                <p className="text-sm text-slate-500">Replies stay attached to this document point for everyone in the session.</p>
                              </div>
                              <Badge variant="outline" className="border-slate-300 text-slate-600">{annotationComments.length} entries</Badge>
                            </div>
                            <form
                              className="space-y-3"
                              onSubmit={(event) => {
                                event.preventDefault();
                                void handleCreateComment({
                                  body: annotationReplyDraft,
                                  annotationId: selectedAnnotation.id,
                                  parentId: annotationReplyParentId,
                                  onSuccess: () => {
                                    setAnnotationReplyDraft("");
                                    setAnnotationReplyParentId(null);
                                  },
                                });
                              }}
                            >
                              <Textarea
                                value={annotationReplyDraft}
                                onChange={(event) => setAnnotationReplyDraft(event.target.value)}
                                placeholder={annotationReplyParentId ? "Reply to the selected thread..." : "Add a threaded comment for this review card..."}
                                className="min-h-[96px] border-slate-200 bg-white"
                              />
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-slate-500">{annotationReplyParentId ? "New reply will attach inside the selected thread." : "Top-level comment in the selected review thread."}</p>
                                <div className="flex items-center gap-2">
                                  {annotationReplyParentId ? <Button type="button" variant="ghost" className="text-slate-500" onClick={() => { setAnnotationReplyDraft(""); setAnnotationReplyParentId(null); }}>Clear reply target</Button> : null}
                                  <Button type="submit" disabled={!annotationReplyDraft.trim()}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send
                                  </Button>
                                </div>
                              </div>
                            </form>
                            <ScrollArea className="h-[320px] rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              {annotationComments.length ? (
                                <ThreadList
                                  comments={annotationComments}
                                  replyDraft={annotationReplyDraft}
                                  replyParentId={annotationReplyParentId}
                                  setReplyDraft={setAnnotationReplyDraft}
                                  setReplyParentId={setAnnotationReplyParentId}
                                  onSubmitReply={(parentId) => handleCreateComment({
                                    body: annotationReplyDraft,
                                    annotationId: selectedAnnotation.id,
                                    parentId,
                                    onSuccess: () => {
                                      setAnnotationReplyDraft("");
                                      setAnnotationReplyParentId(null);
                                    },
                                  })}
                                  onDeleteComment={handleDeleteComment}
                                />
                              ) : (
                                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">No comments on this review card yet.</div>
                              )}
                            </ScrollArea>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                          Select a review card to edit its metadata and join the thread.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="chat" className="mt-4 flex-1">
                  <Card className="flex h-full flex-col border-slate-200 shadow-none">
                    <CardHeader className="border-b border-slate-200 bg-slate-50 pb-4">
                      <CardTitle className="text-slate-950">Shared notes</CardTitle>
                      <CardDescription>Session-level notes are no longer local-only. They sync live for everyone in the same review room.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-5">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="mt-0.5 h-4 w-4 text-sky-600" />
                          <p>Use shared notes for room-level coordination, and use review threads when feedback should stay attached to a specific point on the PDF.</p>
                        </div>
                      </div>
                      <form
                        className="space-y-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void handleCreateComment({
                            body: sessionReplyParentId ? sessionReplyDraft : sessionNoteDraft,
                            annotationId: null,
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
                          placeholder={sessionReplyParentId ? "Reply to the selected note..." : "Add a synced note for everyone in this session..."}
                          className="min-h-[100px] border-slate-200 bg-white"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-slate-500">{sessionReplyParentId ? "Your next note will post as a reply." : "Top-level notes show up for every collaborator in the room."}</p>
                          <div className="flex items-center gap-2">
                            {sessionReplyParentId ? <Button type="button" variant="ghost" className="text-slate-500" onClick={() => { setSessionReplyParentId(null); setSessionReplyDraft(""); }}>Clear reply target</Button> : null}
                            <Button type="submit" disabled={!(sessionReplyParentId ? sessionReplyDraft : sessionNoteDraft).trim()}>
                              <Send className="mr-2 h-4 w-4" />
                              Post note
                            </Button>
                          </div>
                        </div>
                      </form>
                      <ScrollArea className="h-[420px] rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        {sessionNotes.length ? (
                          <ThreadList
                            comments={sessionNotes}
                            replyDraft={sessionReplyDraft}
                            replyParentId={sessionReplyParentId}
                            setReplyDraft={setSessionReplyDraft}
                            setReplyParentId={setSessionReplyParentId}
                            onSubmitReply={(parentId) => handleCreateComment({
                              body: sessionReplyDraft,
                              annotationId: null,
                              parentId,
                              onSuccess: () => {
                                setSessionReplyDraft("");
                                setSessionReplyParentId(null);
                              },
                            })}
                            onDeleteComment={handleDeleteComment}
                          />
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">No shared notes yet. Start the session thread here.</div>
                        )}
                      </ScrollArea>
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
