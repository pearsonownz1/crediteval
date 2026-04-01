import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Camera,
  CameraOff,
  Copy,
  ExternalLink,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Radio,
  RefreshCw,
  Video,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEFAULT_AGORA_CHANNEL, useAgoraCall } from "@/hooks/useAgoraCall";
import {
  buildCallSessionPath,
  buildPdfSessionPath,
  buildSessionSearchParams,
  normalizeSessionId,
  normalizeSessionName,
  resolveSession,
} from "@/lib/collabSession";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const statusStyles = {
  idle: "border-slate-200 bg-slate-50 text-slate-700",
  joining: "border-sky-200 bg-sky-50 text-sky-700",
  joined: "border-emerald-200 bg-emerald-50 text-emerald-700",
  leaving: "border-amber-200 bg-amber-50 text-amber-700",
} as const;

export default function CallPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const resolvedSession = useMemo(() => resolveSession(searchParams), [searchParams]);
  const [sessionIdInput, setSessionIdInput] = useState(resolvedSession.sessionId);
  const [sessionNameInput, setSessionNameInput] = useState(resolvedSession.sessionName);
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
  });

  useEffect(() => {
    if (!searchParams.get("session")) {
      const nextParams = new URLSearchParams(
        buildSessionSearchParams(resolvedSession.sessionId, resolvedSession.sessionName, resolvedSession.token),
      );
      nextParams.set("channel", resolvedSession.sessionId);
      setSearchParams(nextParams, { replace: true });
    }
  }, [resolvedSession.sessionId, resolvedSession.sessionName, resolvedSession.token, searchParams, setSearchParams]);

  useEffect(() => {
    setSessionIdInput(resolvedSession.sessionId);
    setSessionNameInput(resolvedSession.sessionName);
    setChannelName(resolvedSession.channelName);
    setToken(resolvedSession.token);
  }, [
    resolvedSession.channelName,
    resolvedSession.sessionId,
    resolvedSession.sessionName,
    resolvedSession.token,
    setChannelName,
    setToken,
  ]);

  const applySessionDetails = (options?: { announce?: boolean }) => {
    const nextSessionId = normalizeSessionId(sessionIdInput);
    const nextSessionName = normalizeSessionName(sessionNameInput, nextSessionId);
    const nextToken = token.trim();

    setSessionIdInput(nextSessionId);
    setSessionNameInput(nextSessionName);
    setChannelName(nextSessionId);
    const nextParams = new URLSearchParams(buildSessionSearchParams(nextSessionId, nextSessionName, nextToken));
    nextParams.set("channel", nextSessionId);
    setSearchParams(nextParams);

    if (options?.announce !== false) {
      toast({
        title: "Call session updated",
        description: `The call tab now points at session ${nextSessionId}.`,
      });
    }

    return { nextSessionId, nextSessionName, nextToken };
  };

  const handleCopyCallLink = async () => {
    const { nextSessionId, nextSessionName, nextToken } = applySessionDetails({ announce: false });
    const inviteUrl = `${window.location.origin}${buildCallSessionPath(nextSessionId, nextSessionName, nextToken)}`;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast({
        title: "Call link copied",
        description: "Share it if you want someone to land directly in the matching call room.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: inviteUrl,
      });
    }
  };

  const pdfPath = buildPdfSessionPath(resolvedSession.sessionId, resolvedSession.sessionName, token.trim());
  const callPath = buildCallSessionPath(resolvedSession.sessionId, resolvedSession.sessionName, token.trim());

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_30%,#ffffff_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">Agora room</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Live review call</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Join a shared channel for realtime audio and video. This standalone route stays intact while the same call experience is also reused inside the PDF workspace.
            </p>
          </div>
          <Badge variant="outline" className={cn("w-fit rounded-full border px-3 py-1 text-xs font-medium", statusStyles[status])}>
            <Radio className="mr-1.5 h-3.5 w-3.5" />
            {status === "idle" ? "Ready" : status === "joining" ? "Joining" : status === "joined" ? "Connected" : "Leaving"}
          </Badge>
        </div>

        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Call controls</CardTitle>
              <CardDescription>Use the same session link on another device or browser tab to land in the same collaborative room.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="sessionName">Session name</label>
                <Input id="sessionName" value={sessionNameInput} onChange={(event) => setSessionNameInput(event.target.value)} placeholder="Review session" disabled={isBusy} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="channelName">Session ID / Agora room</label>
                <Input
                  id="channelName"
                  value={sessionIdInput}
                  onChange={(event) => {
                    setSessionIdInput(event.target.value);
                    setChannelName(event.target.value);
                  }}
                  placeholder={DEFAULT_AGORA_CHANNEL}
                  disabled={isBusy}
                />
                <p className="text-xs leading-5 text-slate-500">This value is the shared room key across `/pdf` and `/call`.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="token">Token (optional)</label>
                <Input id="token" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Paste Agora token if your project requires one" disabled={isBusy} />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-950">Shared session</p>
                <p className="mt-2">Session name: <span className="font-medium text-slate-900">{resolvedSession.sessionName}</span></p>
                <p className="mt-1">Session ID: <span className="font-mono text-xs text-slate-900 sm:text-sm">{resolvedSession.sessionId}</span></p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" className="border-slate-300" onClick={handleCopyCallLink} disabled={isBusy}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy call link
                  </Button>
                  <Button type="button" onClick={() => applySessionDetails()} disabled={isBusy}>
                    Save session
                  </Button>
                </div>
              </div>

              <Alert className="border-slate-200 bg-slate-50">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Status</AlertTitle>
                <AlertDescription>{statusMessage}</AlertDescription>
              </Alert>

              {errorMessage ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Could not connect</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <Button onClick={() => void joinCall()} disabled={isJoined || isBusy} className="h-11">
                  {status === "joining" ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                  Join call
                </Button>
                <Button onClick={() => void leaveCall()} disabled={!isJoined || isBusy} variant="outline" className="h-11 border-slate-300">
                  <PhoneOff className="mr-2 h-4 w-4" />
                  Leave call
                </Button>
                <Button onClick={() => void toggleMicrophone()} disabled={!isJoined || isBusy} variant="secondary" className="h-11">
                  {isMicEnabled ? <Mic className="mr-2 h-4 w-4" /> : <MicOff className="mr-2 h-4 w-4" />}
                  {isMicEnabled ? "Mute mic" : "Unmute mic"}
                </Button>
                <Button onClick={() => void toggleCamera()} disabled={!isJoined || isBusy} variant="secondary" className="h-11">
                  {isCameraEnabled ? <Camera className="mr-2 h-4 w-4" /> : <CameraOff className="mr-2 h-4 w-4" />}
                  {isCameraEnabled ? "Turn camera off" : "Turn camera on"}
                </Button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-950">Shareable route</p>
                <p className="mt-2 break-all text-xs sm:text-sm">{callPath}</p>
                <p className="mt-3 text-xs leading-5 text-slate-500">If your Agora project uses temporary tokens, the copied link includes the current token value. Treat that link as sensitive.</p>
              </div>

              <Link to={pdfPath} className="inline-flex items-center text-sm font-medium text-sky-700 hover:text-sky-800">
                Open the matching PDF workspace <Video className="ml-2 h-4 w-4" />
              </Link>
              <Link to={callPath} className="inline-flex items-center text-sm font-medium text-slate-700 hover:text-slate-900">
                Refresh this route with the saved session params <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Local preview</CardTitle>
                <CardDescription>Your camera feed is rendered here after you join.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
                  <div ref={localVideoContainerRef} className="aspect-[16/10] w-full" />
                  {!isJoined ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/90 text-center text-slate-300">
                      <Video className="h-10 w-10 text-slate-500" />
                      <p className="text-sm font-medium">Join the room to preview your camera</p>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Remote participants</CardTitle>
                <CardDescription>Anyone who enters the same channel shows up here.</CardDescription>
              </CardHeader>
              <CardContent>
                {remoteParticipants.length === 0 ? (
                  <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-slate-500">
                    <Phone className="mb-3 h-8 w-8 text-slate-400" />
                    <p className="text-sm font-medium text-slate-700">No remote participants yet</p>
                    <p className="mt-2 text-xs leading-5">Open the same channel on another browser window and they’ll appear here. Ghost town for now.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {remoteParticipants.map((participant) => (
                      <div key={participant.uid} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-sm">
                          <span className="font-medium text-slate-950">Participant {participant.uid}</span>
                          <div className="flex items-center gap-2 text-slate-500">
                            {participant.hasAudio ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                            {participant.hasVideo ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                          </div>
                        </div>
                        <div className="relative bg-slate-950">
                          <div ref={(node) => { remoteVideoRefs.current[participant.uid] = node; }} className="aspect-[4/3] w-full" />
                          {!participant.hasVideo ? (
                            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-300">Camera off</div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
