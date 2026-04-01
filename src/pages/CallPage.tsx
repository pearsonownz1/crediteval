import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Camera,
  CameraOff,
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
import { cn } from "@/lib/utils";
import {
  AGORA_APP_ID,
  AgoraClient,
  AgoraLocalAudioTrack,
  AgoraLocalVideoTrack,
  AgoraRemoteUser,
  AgoraUid,
  getAgoraErrorMessage,
  loadAgoraRtcSdk,
} from "@/lib/agoraRtc";

const DEFAULT_CHANNEL = "crediteval-demo";

type CallStatus = "idle" | "joining" | "joined" | "leaving";

type RemoteParticipant = {
  uid: string;
  hasAudio: boolean;
  hasVideo: boolean;
  audioTrack?: AgoraRemoteUser["audioTrack"];
  videoTrack?: AgoraRemoteUser["videoTrack"];
};

const statusStyles = {
  idle: "border-slate-200 bg-slate-50 text-slate-700",
  joining: "border-sky-200 bg-sky-50 text-sky-700",
  joined: "border-emerald-200 bg-emerald-50 text-emerald-700",
  leaving: "border-amber-200 bg-amber-50 text-amber-700",
} as const;

function toParticipant(user: AgoraRemoteUser): RemoteParticipant {
  return {
    uid: String(user.uid),
    hasAudio: Boolean(user.hasAudio || user.audioTrack),
    hasVideo: Boolean(user.hasVideo || user.videoTrack),
    audioTrack: user.audioTrack,
    videoTrack: user.videoTrack,
  };
}

export default function CallPage() {
  const [searchParams] = useSearchParams();
  const [channelName, setChannelName] = useState(searchParams.get("channel") || DEFAULT_CHANNEL);
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [status, setStatus] = useState<CallStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    "Ready to join. Use a shared channel name so another participant can enter the same room.",
  );
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);

  const clientRef = useRef<AgoraClient | null>(null);
  const localAudioTrackRef = useRef<AgoraLocalAudioTrack | null>(null);
  const localVideoTrackRef = useRef<AgoraLocalVideoTrack | null>(null);
  const localVideoContainerRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const joinedRef = useRef(false);

  const isJoined = status === "joined";
  const isBusy = status === "joining" || status === "leaving";
  const normalizedChannel = channelName.trim();
  const normalizedToken = token.trim();

  const upsertRemoteUser = useCallback((user: AgoraRemoteUser) => {
    const nextParticipant = toParticipant(user);

    setRemoteParticipants((currentParticipants) => {
      const remainingParticipants = currentParticipants.filter(
        (participant) => participant.uid !== nextParticipant.uid,
      );
      return [...remainingParticipants, nextParticipant];
    });
  }, []);

  const removeRemoteUser = useCallback((uid: AgoraUid) => {
    const normalizedUid = String(uid);
    const remoteContainer = remoteVideoRefs.current[normalizedUid];

    if (remoteContainer) {
      remoteContainer.innerHTML = "";
    }

    delete remoteVideoRefs.current[normalizedUid];
    setRemoteParticipants((currentParticipants) =>
      currentParticipants.filter((participant) => participant.uid !== normalizedUid),
    );
  }, []);

  const cleanupCall = useCallback(async () => {
    const audioTrack = localAudioTrackRef.current;
    const videoTrack = localVideoTrackRef.current;
    const client = clientRef.current;

    localAudioTrackRef.current = null;
    localVideoTrackRef.current = null;
    clientRef.current = null;
    joinedRef.current = false;
    setRemoteParticipants([]);

    if (localVideoContainerRef.current) {
      localVideoContainerRef.current.innerHTML = "";
    }

    Object.values(remoteVideoRefs.current).forEach((remoteContainer) => {
      if (remoteContainer) {
        remoteContainer.innerHTML = "";
      }
    });

    if (audioTrack) {
      audioTrack.stop();
      audioTrack.close();
    }

    if (videoTrack) {
      videoTrack.stop();
      videoTrack.close();
    }

    if (client) {
      client.removeAllListeners?.();
      await client.leave().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    remoteParticipants.forEach((participant) => {
      const remoteContainer = remoteVideoRefs.current[participant.uid];

      if (!remoteContainer || !participant.videoTrack) {
        return;
      }

      remoteContainer.innerHTML = "";
      participant.videoTrack.play(remoteContainer);
    });
  }, [remoteParticipants]);

  useEffect(() => {
    return () => {
      void cleanupCall();
    };
  }, [cleanupCall]);

  const handleJoin = useCallback(async () => {
    if (!normalizedChannel) {
      setErrorMessage("Enter a channel name before starting the call.");
      setStatusMessage("A valid channel name is required before joining.");
      return;
    }

    setErrorMessage("");
    setStatus("joining");
    setStatusMessage("Connecting to Agora and requesting camera/microphone access...");

    try {
      await cleanupCall();

      const AgoraRTC = await loadAgoraRtcSdk();
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);

        if (mediaType === "audio" && user.audioTrack) {
          user.audioTrack.play();
        }

        upsertRemoteUser(user);
      });

      client.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "audio") {
          user.audioTrack?.stop();
        }

        upsertRemoteUser({
          ...user,
          audioTrack: mediaType === "audio" ? undefined : user.audioTrack,
          videoTrack: mediaType === "video" ? undefined : user.videoTrack,
          hasAudio: mediaType === "audio" ? false : Boolean(user.hasAudio || user.audioTrack),
          hasVideo: mediaType === "video" ? false : Boolean(user.hasVideo || user.videoTrack),
        });
      });

      client.on("user-left", (user) => {
        removeRemoteUser(user.uid);
      });

      await client.join(AGORA_APP_ID, normalizedChannel, normalizedToken || null, null);

      const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localAudioTrackRef.current = microphoneTrack;
      localVideoTrackRef.current = cameraTrack;
      joinedRef.current = true;

      if (localVideoContainerRef.current) {
        localVideoContainerRef.current.innerHTML = "";
        cameraTrack.play(localVideoContainerRef.current);
      }

      await client.publish([microphoneTrack, cameraTrack]);

      setIsMicEnabled(true);
      setIsCameraEnabled(true);
      setStatus("joined");
      setStatusMessage(
        `Live in channel "${normalizedChannel}". Share the same route and channel name with another participant.`,
      );
    } catch (error) {
      await cleanupCall();
      setStatus("idle");
      setErrorMessage(getAgoraErrorMessage(error));
      setStatusMessage("Session setup failed. Review permissions, token, and network access, then try again.");
    }
  }, [cleanupCall, normalizedChannel, normalizedToken, removeRemoteUser, upsertRemoteUser]);

  const handleLeave = useCallback(async () => {
    setStatus("leaving");
    await cleanupCall();
    setStatus("idle");
    setErrorMessage("");
    setStatusMessage("Call ended. You can rejoin with the same channel or switch to a new one.");
  }, [cleanupCall]);

  const toggleMicrophone = useCallback(async () => {
    const audioTrack = localAudioTrackRef.current;

    if (!audioTrack) {
      return;
    }

    const nextEnabled = !isMicEnabled;
    await audioTrack.setEnabled(nextEnabled);
    setIsMicEnabled(nextEnabled);
  }, [isMicEnabled]);

  const toggleCamera = useCallback(async () => {
    const videoTrack = localVideoTrackRef.current;

    if (!videoTrack) {
      return;
    }

    const nextEnabled = !isCameraEnabled;
    await videoTrack.setEnabled(nextEnabled);
    setIsCameraEnabled(nextEnabled);

    if (!nextEnabled && localVideoContainerRef.current) {
      localVideoContainerRef.current.innerHTML = "";
    }

    if (nextEnabled && localVideoContainerRef.current) {
      videoTrack.play(localVideoContainerRef.current);
    }
  }, [isCameraEnabled]);

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.18),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_42%,_#ffffff_100%)] py-12 text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge variant="secondary" className="w-fit bg-sky-100 text-sky-800 hover:bg-sky-100">
              Dedicated Agora demo route
            </Badge>
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Browser-based Agora audio and video demo
              </h1>
              <p className="text-base leading-7 text-slate-600">
                The Web SDK is loaded at runtime in the browser, isolated from the rest of the app, and the join flow
                is already structured for a secure token service later.
              </p>
            </div>
          </div>
          <Card className="border-sky-200/80 bg-white/90 backdrop-blur">
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <Badge variant={isJoined ? "default" : "outline"} className={cn(isJoined && "bg-emerald-600")}>
                {isJoined ? "Live" : "Offline"}
              </Badge>
              <Badge variant="outline">App ID: {AGORA_APP_ID.slice(0, 8)}...</Badge>
              <Badge variant="outline">
                {remoteParticipants.length} remote participant{remoteParticipants.length === 1 ? "" : "s"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Session error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="border-slate-200/80 bg-white/90 shadow-lg shadow-sky-100/60">
            <CardHeader>
              <CardTitle>Join controls</CardTitle>
              <CardDescription>{statusMessage}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Channel name</span>
                <Input
                  autoComplete="off"
                  disabled={isBusy || isJoined}
                  onChange={(event) => setChannelName(event.target.value)}
                  placeholder={DEFAULT_CHANNEL}
                  value={channelName}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Token</span>
                <Input
                  autoComplete="off"
                  disabled={isBusy || isJoined}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="Optional for demo, required later for secured production"
                  value={token}
                />
                <p className="text-xs leading-5 text-slate-500">
                  Leave blank for this demo. In production, replace it with a backend-issued token per user and
                  channel.
                </p>
              </label>

              <div className="flex flex-wrap gap-3">
                <Button className="flex-1" disabled={isBusy || isJoined} onClick={() => void handleJoin()}>
                  {status === "joining" ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Phone className="mr-2 h-4 w-4" />
                      Join and start
                    </>
                  )}
                </Button>
                <Button disabled={!isJoined || isBusy} onClick={() => void handleLeave()} variant="outline">
                  <PhoneOff className="mr-2 h-4 w-4" />
                  Leave
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button disabled={!isJoined || isBusy} onClick={() => void toggleMicrophone()} variant="secondary">
                  {isMicEnabled ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                  {isMicEnabled ? "Mute mic" : "Unmute mic"}
                </Button>
                <Button disabled={!isJoined || isBusy} onClick={() => void toggleCamera()} variant="secondary">
                  {isCameraEnabled ? <CameraOff className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
                  {isCameraEnabled ? "Camera off" : "Camera on"}
                </Button>
              </div>

              <div className={cn("rounded-xl border px-4 py-3 text-sm", statusStyles[status])}>{statusMessage}</div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Open this route in two browsers or on two devices, join the same channel, and the remote tile will
                populate automatically as soon as the other participant publishes.
              </div>

              <Button asChild variant="outline" className="w-full">
                <Link to="/contact">Back to main site</Link>
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="overflow-hidden border-slate-200/80 bg-white/90 shadow-lg shadow-sky-100/60">
                <CardHeader>
                  <CardTitle>Local preview</CardTitle>
                  <CardDescription>Your camera feed appears here after you join and publish.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-950">
                    <div className="absolute left-3 top-3 z-10 flex gap-2">
                      <Badge variant="outline" className="border-white/20 bg-black/35 text-white">
                        {isMicEnabled && isJoined ? "Mic on" : "Mic muted"}
                      </Badge>
                      <Badge variant="outline" className="border-white/20 bg-black/35 text-white">
                        {isCameraEnabled && isJoined ? "Camera on" : "Camera off"}
                      </Badge>
                    </div>
                    <div ref={localVideoContainerRef} className="absolute inset-0" />
                    {!isJoined || !isCameraEnabled ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-slate-300">
                        <Video className="h-10 w-10" />
                        <div className="space-y-1">
                          <p className="text-base font-medium">
                            {isJoined ? "Camera is currently off" : "Join the channel to start local preview"}
                          </p>
                          <p className="text-sm text-slate-400">
                            Your local camera feed will render here once media is active.
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-slate-200/80 bg-white/90 shadow-lg shadow-sky-100/60">
                <CardHeader>
                  <CardTitle>Remote participants</CardTitle>
                  <CardDescription>Incoming audio/video tiles appear here when someone joins the same channel.</CardDescription>
                </CardHeader>
                <CardContent>
                  {remoteParticipants.length === 0 ? (
                    <div className="flex aspect-video flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
                      <Radio className="mb-3 h-10 w-10 text-slate-400" />
                      <p className="text-base font-medium text-slate-700">No remote participants yet</p>
                      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                        Join the same channel from another device or browser tab to test incoming video and audio.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {remoteParticipants.map((participant) => (
                        <div
                          key={participant.uid}
                          className="relative aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-950"
                        >
                          <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
                            <Badge variant="outline" className="border-white/20 bg-black/35 text-white">
                              Participant {participant.uid}
                            </Badge>
                            <Badge variant="outline" className="border-white/20 bg-black/35 text-white">
                              {participant.hasAudio ? "Audio" : "No audio"}
                            </Badge>
                          </div>
                          <div
                            className="absolute inset-0"
                            ref={(node) => {
                              remoteVideoRefs.current[participant.uid] = node;
                            }}
                          />
                          {!participant.hasVideo ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-slate-300">
                              <Video className="h-10 w-10" />
                              <div className="space-y-1">
                                <p className="text-base font-medium">Audio-only participant</p>
                                <p className="text-sm text-slate-400">
                                  Their audio is live. No remote camera is currently published.
                                </p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-200/80 bg-white/90 shadow-lg shadow-sky-100/60">
              <CardHeader>
                <CardTitle>Production notes</CardTitle>
                <CardDescription>This page is ready for a secure token flow without a structural rewrite.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm leading-6 text-slate-600 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  Keep the App ID public in the client and request a short-lived token from your backend before join.
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  Replace the manual token field with an authenticated endpoint keyed to the current user and channel.
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  If your CSP is strict, allow the Agora CDN script source or self-host the SDK with the same helper.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-slate-200/80 bg-white/80">
          <CardContent className="flex flex-col gap-2 p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <span>Shareable demo route</span>
            <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-800">
              /call?channel={normalizedChannel || DEFAULT_CHANNEL}
            </code>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
