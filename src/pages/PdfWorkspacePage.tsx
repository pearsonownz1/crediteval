import { ChangeEvent, DragEvent, FormEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
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
  MousePointer2,
  PenLine,
  Phone,
  PhoneOff,
  Radio,
  RefreshCw,
  Save,
  Send,
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
  body: string | null;
  xPercent: number;
  yPercent: number;
  createdAt: string;
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
  const [chatDraft, setChatDraft] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [sessionIdInput, setSessionIdInput] = useState(resolvedSession.sessionId);
  const [sessionNameInput, setSessionNameInput] = useState(resolvedSession.sessionName);
  const [participantName, setParticipantName] = useState(getStoredParticipantName);
  const [documentRecord, setDocumentRecord] = useState<SessionDocument | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [presenceParticipants, setPresenceParticipants] = useState<WorkspacePresence[]>([]);
  const [annotations, setAnnotations] = useState<AnnotationRecord[]>([]);
  const [annotationDraft, setAnnotationDraft] = useState("");
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [interactionMode, setInteractionMode] = useState<"navigate" | "annotate">("navigate");
  const [isPresenceReady, setIsPresenceReady] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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

  const localParticipantColor = useMemo(
    () => getParticipantColor(localParticipantId.current),
    [],
  );
  const selectedAnnotation = useMemo(
    () => annotations.find((annotation) => annotation.id === selectedAnnotationId) ?? null,
    [annotations, selectedAnnotationId],
  );
  const otherParticipants = useMemo(
    () => presenceParticipants.filter((participant) => !participant.isSelf),
    [presenceParticipants],
  );

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
    setSelectedAnnotationId(null);

    let isMounted = true;

    const loadAnnotations = async () => {
      const { data, error } = await supabase
        .from("pdf_collab_annotations")
        .select("id, session_id, author_id, author_name, color, body, x_percent, y_percent, created_at")
        .eq("session_id", resolvedSession.sessionId)
        .order("created_at", { ascending: true });

      if (!isMounted || error) {
        return;
      }

      setAnnotations(
        (data || []).map((annotation) => ({
          id: annotation.id,
          sessionId: annotation.session_id,
          authorId: annotation.author_id,
          authorName: annotation.author_name,
          color: annotation.color,
          body: annotation.body,
          xPercent: Number(annotation.x_percent),
          yPercent: Number(annotation.y_percent),
          createdAt: annotation.created_at,
        })),
      );
    };

    void loadAnnotations();

    return () => {
      isMounted = false;
    };
  }, [resolvedSession.sessionId]);

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
          if (payload.eventType === "INSERT") {
            const next = payload.new as Record<string, string | number | null>;
            setAnnotations((current) => {
              if (current.some((annotation) => annotation.id === next.id)) {
                return current;
              }

              return [
                ...current,
                {
                  id: String(next.id),
                  sessionId: String(next.session_id),
                  authorId: String(next.author_id),
                  authorName: String(next.author_name),
                  color: String(next.color),
                  body: (next.body as string | null) ?? null,
                  xPercent: Number(next.x_percent),
                  yPercent: Number(next.y_percent),
                  createdAt: String(next.created_at),
                },
              ];
            });
            return;
          }

          if (payload.eventType === "DELETE") {
            const previous = payload.old as Record<string, string | null>;
            setAnnotations((current) => current.filter((annotation) => annotation.id !== previous.id));
            setSelectedAnnotationId((current) => (current === previous.id ? null : current));
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

    const { data, error } = await supabase
      .from("pdf_collab_annotations")
      .insert({
        session_id: resolvedSession.sessionId,
        author_id: localParticipantId.current,
        author_name: participantName.trim() || "Reviewer",
        color: localParticipantColor,
        body: annotationDraft.trim() || null,
        x_percent: xPercent,
        y_percent: yPercent,
      })
      .select("id, session_id, author_id, author_name, color, body, x_percent, y_percent, created_at")
      .single();

    if (error) {
      toast({
        title: "Markup not added",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const nextAnnotation: AnnotationRecord = {
      id: data.id,
      sessionId: data.session_id,
      authorId: data.author_id,
      authorName: data.author_name,
      color: data.color,
      body: data.body,
      xPercent: Number(data.x_percent),
      yPercent: Number(data.y_percent),
      createdAt: data.created_at,
    };

    setAnnotations((current) => (current.some((annotation) => annotation.id === nextAnnotation.id) ? current : [...current, nextAnnotation]));
    setSelectedAnnotationId(nextAnnotation.id);
    setInteractionMode("navigate");
    setAnnotationDraft("");
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
                    <CardDescription>The PDF stays central. Presence cursors and lightweight shared markups now sit on top of the workspace for live review.</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
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
                    <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-950">{documentRecord.originalFilename}</p>
                          <p className="text-xs text-slate-500">{metadata?.size} · Shared in session {resolvedSession.sessionId}</p>
                        </div>
                        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">EmbedPDF viewer</div>
                      </div>
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
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
                            Drop markup
                          </Button>
                          <Badge variant="outline" className="border-slate-300 text-slate-600">
                            {otherParticipants.length} collaborator{otherParticipants.length === 1 ? "" : "s"} live
                          </Badge>
                        </div>
                        <div className="flex flex-1 items-center gap-2 xl:max-w-md">
                          <Input
                            value={annotationDraft}
                            onChange={(event) => setAnnotationDraft(event.target.value)}
                            placeholder="Optional note for the next markup"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="relative h-[980px] w-full overflow-hidden bg-white" onPointerMove={handleWorkspacePointerMove} onPointerLeave={handleWorkspacePointerLeave}>
                      <div ref={viewerHostRef} className="h-full w-full bg-white" />
                      <div className="pointer-events-none absolute inset-0 z-10">
                        {annotations.map((annotation, index) => (
                          <button
                            key={annotation.id}
                            type="button"
                            className={cn(
                              "pointer-events-auto absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white shadow-[0_10px_30px_rgba(15,23,42,0.24)] transition hover:scale-105",
                              selectedAnnotationId === annotation.id ? "ring-4 ring-sky-100" : "",
                            )}
                            style={{
                              left: `${annotation.xPercent}%`,
                              top: `${annotation.yPercent}%`,
                              backgroundColor: annotation.color,
                            }}
                            onClick={() => setSelectedAnnotationId(annotation.id)}
                            title={annotation.body || `Markup ${index + 1}`}
                          >
                            {index + 1}
                          </button>
                        ))}
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
                          aria-label="Place shared markup"
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
                      <CardDescription className="text-slate-300">Video and audio stay pinned at the top of the collaboration rail while the PDF remains the main workspace.</CardDescription>
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

              <Tabs defaultValue="session" className="flex min-h-0 flex-1 flex-col">
                <TabsList className="grid w-full grid-cols-3 bg-slate-100">
                  <TabsTrigger value="session"><FileBadge2 className="mr-2 h-4 w-4" />Session</TabsTrigger>
                  <TabsTrigger value="markup"><PenLine className="mr-2 h-4 w-4" />Markup</TabsTrigger>
                  <TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4" />Chat</TabsTrigger>
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
                        <Input id="workspace-participant-name" value={participantName} onChange={(event) => setParticipantName(event.target.value)} placeholder="Reviewer name used for cursors and markups" />
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
                          <p className="mt-2">Supabase Presence keeps reviewer cursors live in the active session, while the session record and shared PDF stay on the same `session_id` key.</p>
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
                      <CardTitle className="text-slate-950">Shared markups</CardTitle>
                      <CardDescription>Drop quick pins on the PDF surface. Every annotation is stored by session and syncs to everyone in the room.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-5">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        <p className="font-medium text-slate-950">How it works</p>
                        <p className="mt-2">Switch to <span className="font-medium">Drop markup</span>, click the document, and a shared note pin is inserted for the whole session.</p>
                      </div>
                      <ScrollArea className="h-[360px] rounded-2xl border border-slate-200 bg-white">
                        <div className="space-y-3 p-4">
                          {annotations.length ? annotations.map((annotation, index) => (
                            <button
                              key={annotation.id}
                              type="button"
                              className={cn(
                                "w-full rounded-2xl border px-4 py-3 text-left transition",
                                selectedAnnotationId === annotation.id ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white hover:border-slate-300",
                              )}
                              onClick={() => setSelectedAnnotationId(annotation.id)}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2 text-sm font-medium text-slate-950">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: annotation.color }}>
                                      {index + 1}
                                    </span>
                                    <span>{annotation.authorName}</span>
                                  </div>
                                  <p className="mt-2 text-sm leading-6 text-slate-700">{annotation.body || "Untitled markup"}</p>
                                  <p className="mt-2 text-xs text-slate-500">{new Date(annotation.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                                </div>
                                <span className="text-xs text-slate-400">{annotation.xPercent.toFixed(1)}%, {annotation.yPercent.toFixed(1)}%</span>
                              </div>
                            </button>
                          )) : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No shared markups yet.</div>}
                        </div>
                      </ScrollArea>
                      {selectedAnnotation ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">{selectedAnnotation.authorName}</p>
                              <p className="mt-1 text-sm leading-6 text-slate-700">{selectedAnnotation.body || "Untitled markup"}</p>
                            </div>
                            <Button variant="outline" size="sm" className="border-slate-300" onClick={() => void handleDeleteAnnotation(selectedAnnotation.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ) : null}
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
