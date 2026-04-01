import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import EmbedPDF from "@embedpdf/snippet";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Download,
  FileBadge2,
  FileText,
  MessageSquare,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Radio,
  RefreshCw,
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { DEFAULT_AGORA_CHANNEL, useAgoraCall } from "@/hooks/useAgoraCall";
import { cn } from "@/lib/utils";

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

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

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    author: "Elena",
    role: "Team",
    text: "Uploaded the latest transcript. Let’s use this space to flag any line items that need follow-up before final delivery.",
    timestamp: "9:12 AM",
  },
  {
    id: 2,
    author: "Ops",
    role: "Team",
    text: "I already validated the seal page. The remaining question is whether the appendix formatting should match the agency template.",
    timestamp: "9:18 AM",
  },
  {
    id: 3,
    author: "You",
    role: "You",
    text: "Got it. I’m reviewing page 3 now and will note anything that looks inconsistent with the translated summary.",
    timestamp: "9:21 AM",
  },
];

const PdfWorkspacePage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const viewerHostRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [chatDraft, setChatDraft] = useState("");
  const [messages, setMessages] = useState(initialMessages);
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
    handleJoin,
    handleLeave,
    toggleMicrophone,
    toggleCamera,
  } = useAgoraCall({
    initialChannel: DEFAULT_AGORA_CHANNEL,
    readyMessage: "Ready to bring reviewers into the room. Match the same channel name on every participant tab.",
    joinedMessage: (channel) => `Connected to "${channel}". Review the PDF while the call runs alongside it.`,
    leftMessage: "Call ended. The PDF workspace stays open, and you can jump back in whenever you need.",
  });

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

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!chatDraft.trim()) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        author: "You",
        role: "You",
        text: chatDraft.trim(),
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      },
    ]);
    setChatDraft("");
  };

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_30%,#ffffff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-5">
        <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.10)]">
          <div className="flex flex-col gap-5 border-b border-slate-200 bg-slate-950 px-6 py-5 text-white xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">Collaborative PDF review</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Review the document, keep the call live, and chat beside the file</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                The PDF stays dominant on the left. The collaboration rail on the right keeps live discussion and lightweight review chat one click away instead of scattered across three tabs like savages.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className={cn("rounded-full border px-3 py-1 text-xs font-medium", statusStyles[status])}>
                <Radio className="mr-1.5 h-3.5 w-3.5" />
                {status === "idle" ? "Call ready" : status === "joining" ? "Joining" : status === "joined" ? "Live" : "Leaving"}
              </Badge>
              <Button variant="secondary" className="bg-white text-slate-950 hover:bg-slate-100" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload PDF
              </Button>
              <Button variant="outline" className="border-slate-700 bg-transparent text-white hover:bg-slate-900" onClick={handleDownload} disabled={!uploadedFile}>
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
                    <CardDescription>EmbedPDF stays front and center so reviewers can read at full size while collaborating in parallel.</CardDescription>
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
                    <h2 className="text-2xl font-semibold text-slate-950">Drop a PDF to launch the review workspace</h2>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                      Open a document, keep a live call running, and use the side rail for reviewer context without shrinking the file into a sad little postage stamp.
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
                        <p className="truncate text-sm font-medium text-slate-950">{uploadedFile.name}</p>
                        <p className="text-xs text-slate-500">{metadata?.size} · Ready for collaborative review</p>
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
                  <CardDescription>Lightweight file metadata and room context for the current session.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 p-5 text-sm text-slate-700">
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <span className="text-slate-500">Document</span>
                    <span className="max-w-[58%] truncate text-right font-medium text-slate-950">{metadata?.name ?? "Awaiting upload"}</span>
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
                    <p className="font-medium text-slate-950">Session note</p>
                    <p className="mt-2">Use the same Agora channel in the call tab for every reviewer. The chat tab is a polished in-app prototype for coordination and isn’t persisted yet.</p>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="call" className="flex-1">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                  <TabsTrigger value="call">Call</TabsTrigger>
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                </TabsList>

                <TabsContent value="call" className="mt-4 h-full">
                  <Card className="flex h-full flex-col border-slate-200 shadow-none">
                    <CardHeader className="border-b border-slate-200 bg-white pb-4">
                      <CardTitle>Review call</CardTitle>
                      <CardDescription>Join the room, keep your preview visible, and watch remote participants while the PDF stays open.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-4 p-5">
                      <div className="grid gap-3">
                        <div className="space-y-2">
                          <label htmlFor="workspace-channel" className="text-sm font-medium text-slate-700">Channel name</label>
                          <Input id="workspace-channel" value={channelName} onChange={(event) => setChannelName(event.target.value)} placeholder={DEFAULT_AGORA_CHANNEL} disabled={isBusy} />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="workspace-token" className="text-sm font-medium text-slate-700">Token (optional)</label>
                          <Input id="workspace-token" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Paste an Agora token if required" disabled={isBusy} />
                        </div>
                      </div>

                      <Alert className="border-slate-200 bg-slate-50">
                        <AlertTitle className="flex items-center gap-2 text-sm text-slate-950">
                          <Radio className="h-4 w-4 text-sky-700" /> Room status
                        </AlertTitle>
                        <AlertDescription>{statusMessage}</AlertDescription>
                      </Alert>

                      {errorMessage ? (
                        <Alert variant="destructive">
                          <AlertTitle>Could not connect</AlertTitle>
                          <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                      ) : null}

                      <div className="grid grid-cols-2 gap-3">
                        <Button onClick={() => void handleJoin()} disabled={isJoined || isBusy} className="h-11">
                          {status === "joining" ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                          Join
                        </Button>
                        <Button onClick={() => void handleLeave()} disabled={!isJoined || isBusy} variant="outline" className="h-11 border-slate-300">
                          <PhoneOff className="mr-2 h-4 w-4" />
                          Leave
                        </Button>
                        <Button onClick={() => void toggleMicrophone()} disabled={!isJoined || isBusy} variant="secondary" className="h-11">
                          {isMicEnabled ? <Mic className="mr-2 h-4 w-4" /> : <MicOff className="mr-2 h-4 w-4" />}
                          {isMicEnabled ? "Mute" : "Unmute"}
                        </Button>
                        <Button onClick={() => void toggleCamera()} disabled={!isJoined || isBusy} variant="secondary" className="h-11">
                          {isCameraEnabled ? <Camera className="mr-2 h-4 w-4" /> : <CameraOff className="mr-2 h-4 w-4" />}
                          {isCameraEnabled ? "Camera off" : "Camera on"}
                        </Button>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-1">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
                          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 text-sm text-slate-200">
                            <span className="font-medium">Local preview</span>
                            <span className="text-xs text-slate-400">{normalizedChannel || DEFAULT_AGORA_CHANNEL}</span>
                          </div>
                          <div className="relative">
                            <div ref={localVideoContainerRef} className="aspect-[16/10] w-full" />
                            {!isJoined ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/90 text-center text-slate-300">
                                <Video className="h-10 w-10 text-slate-500" />
                                <p className="text-sm font-medium">Join to preview your camera</p>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex min-h-[220px] flex-col rounded-2xl border border-slate-200 bg-slate-50">
                          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                            <p className="text-sm font-medium text-slate-950">Remote participants</p>
                            <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">{remoteParticipants.length}</Badge>
                          </div>
                          {remoteParticipants.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center text-slate-500">
                              <Phone className="mb-3 h-7 w-7 text-slate-400" />
                              <p className="text-sm font-medium text-slate-700">Waiting for someone else to join</p>
                              <p className="mt-2 text-xs leading-5">Open the same channel in another tab or on another machine and their feed will land here.</p>
                            </div>
                          ) : (
                            <div className="grid gap-3 p-3">
                              {remoteParticipants.map((participant) => (
                                <div key={participant.uid} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                  <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-xs text-slate-500">
                                    <span className="font-medium text-slate-900">Participant {participant.uid}</span>
                                    <div className="flex items-center gap-2">
                                      {participant.hasAudio ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                                      {participant.hasVideo ? <Camera className="h-3.5 w-3.5" /> : <CameraOff className="h-3.5 w-3.5" />}
                                    </div>
                                  </div>
                                  <div className="relative bg-slate-950">
                                    <div ref={(node) => { remoteVideoRefs.current[participant.uid] = node; }} className="aspect-[16/10] w-full" />
                                    {!participant.hasVideo ? (
                                      <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-300">Camera off</div>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="chat" className="mt-4 h-full">
                  <Card className="flex h-full flex-col border-slate-200 shadow-none">
                    <CardHeader className="border-b border-slate-200 bg-white pb-4">
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-sky-700" />
                        Review chat
                      </CardTitle>
                      <CardDescription>A polished internal chat prototype for document review notes. It’s local-only for now, but the UI is ready for a real backend later.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-4 p-0">
                      <div className="flex items-center justify-between px-5 pt-5 text-sm text-slate-600">
                        <div>
                          <p className="font-medium text-slate-950">Review thread</p>
                          <p className="text-xs text-slate-500">Discuss edits, approvals, and weird formatting crimes in one place.</p>
                        </div>
                        <Badge variant="outline" className="rounded-full">Prototype</Badge>
                      </div>
                      <Separator />
                      <ScrollArea className="h-[420px] px-5">
                        <div className="space-y-4 pb-5">
                          {messages.map((message) => (
                            <div key={message.id} className={cn("flex gap-3", message.role === "You" ? "justify-end" : "justify-start")}>
                              {message.role === "Team" ? (
                                <Avatar className="mt-1 h-9 w-9 border border-slate-200">
                                  <AvatarFallback className="bg-slate-100 text-slate-700">{message.author.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                              ) : null}
                              <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 shadow-sm", message.role === "You" ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-900")}>
                                <div className="mb-1 flex items-center gap-2 text-xs">
                                  <span className={cn("font-semibold", message.role === "You" ? "text-slate-200" : "text-slate-700")}>{message.author}</span>
                                  <span className={message.role === "You" ? "text-slate-400" : "text-slate-400"}>{message.timestamp}</span>
                                </div>
                                <p className={cn("text-sm leading-6", message.role === "You" ? "text-slate-100" : "text-slate-600")}>{message.text}</p>
                              </div>
                              {message.role === "You" ? (
                                <Avatar className="mt-1 h-9 w-9 border border-slate-800">
                                  <AvatarFallback className="bg-slate-900 text-slate-100">YU</AvatarFallback>
                                </Avatar>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <Separator />
                      <form onSubmit={handleSendMessage} className="space-y-3 p-5">
                        <Textarea value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} placeholder="Add a review note, capture a decision, or leave a reminder for the next pass..." className="min-h-[110px] resize-none border-slate-200 bg-slate-50" />
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs leading-5 text-slate-500">Prototype-only for now: messages stay in local page state and reset on refresh.</p>
                          <Button type="submit" disabled={!chatDraft.trim()}>
                            <Send className="mr-2 h-4 w-4" />
                            Send
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
};

export default PdfWorkspacePage;
