import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  AudioLines,
  Loader2,
  Mic,
  Play,
  ShieldAlert,
  Sparkles,
  Square,
  Volume2,
  Waves,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

type PermissionStateValue = "idle" | "prompt" | "granted" | "denied" | "unsupported";
type InteractionMode = "hold" | "tap";
type ConversationTurn = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const mimeTypeCandidates = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
] as const;

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  return mimeTypeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
}

function blobToAudioUrl(base64Audio: string, mimeType: string) {
  const binary = window.atob(base64Audio);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

export default function VoiceAssistantPage() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const responseAudioRef = useRef<HTMLAudioElement | null>(null);
  const holdPointerActiveRef = useRef(false);
  const suppressClickRef = useRef(false);

  const [permissionState, setPermissionState] = useState<PermissionStateValue>("idle");
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("hold");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [liveStatus, setLiveStatus] = useState("Ready for a push-to-talk exchange.");
  const [transcript, setTranscript] = useState("");
  const [responseText, setResponseText] = useState("");
  const [responseAudioUrl, setResponseAudioUrl] = useState("");
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);

  useEffect(() => {
    return () => {
      if (responseAudioRef.current) {
        responseAudioRef.current.pause();
      }
      if (responseAudioUrl) {
        URL.revokeObjectURL(responseAudioUrl);
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [responseAudioUrl]);

  const releaseMicrophone = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  };

  const ensureMicrophoneAccess = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setPermissionState("unsupported");
      throw new Error("This browser does not support microphone recording.");
    }

    if (mediaStreamRef.current) {
      return mediaStreamRef.current;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setPermissionState("granted");
      return stream;
    } catch (error) {
      const denied =
        error instanceof DOMException &&
        (error.name === "NotAllowedError" || error.name === "PermissionDeniedError");

      setPermissionState(denied ? "denied" : "prompt");
      throw new Error(denied ? "Microphone access was denied." : "Microphone access failed.");
    }
  };

  const processRecording = async (blob: Blob, mimeType: string) => {
    setIsProcessing(true);
    setErrorMessage("");
    setLiveStatus("Transcribing, drafting a reply, and generating speech...");

    const historyPayload = conversation.map((turn) => ({
      role: turn.role,
      text: turn.text,
    }));

    const fileExtension = mimeType.includes("ogg")
      ? "ogg"
      : mimeType.includes("mp4")
        ? "m4a"
        : "webm";

    const formData = new FormData();
    formData.append("audio", new File([blob], `voice-note.${fileExtension}`, { type: mimeType || "audio/webm" }));
    formData.append("history", JSON.stringify(historyPayload));

    try {
      const { data, error } = await supabase.functions.invoke("voice-assistant", {
        body: formData,
      });

      if (error) {
        throw error;
      }

      const nextTranscript = typeof data?.transcript === "string" ? data.transcript : "";
      const nextResponse = typeof data?.responseText === "string" ? data.responseText : "";
      const nextAudioBase64 = typeof data?.audioBase64 === "string" ? data.audioBase64 : "";
      const nextAudioMimeType =
        typeof data?.audioMimeType === "string" ? data.audioMimeType : "audio/mpeg";

      if (!nextTranscript || !nextResponse || !nextAudioBase64) {
        throw new Error("The voice assistant returned an incomplete payload.");
      }

      setTranscript(nextTranscript);
      setResponseText(nextResponse);

      setConversation((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "user", text: nextTranscript },
        { id: crypto.randomUUID(), role: "assistant", text: nextResponse },
      ]);

      if (responseAudioUrl) {
        URL.revokeObjectURL(responseAudioUrl);
      }

      responseAudioRef.current?.pause();
      const nextAudioUrl = blobToAudioUrl(nextAudioBase64, nextAudioMimeType);
      setResponseAudioUrl(nextAudioUrl);
      setLiveStatus("Reply ready. Playing audio response.");

      const audio = new Audio(nextAudioUrl);
      responseAudioRef.current = audio;
      void audio.play().catch(() => {
        setLiveStatus("Reply ready. Use the player below if autoplay is blocked.");
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Voice request failed.";
      setErrorMessage(message);
      setLiveStatus("The last exchange failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    if (isRecording || isProcessing) {
      return;
    }

    setErrorMessage("");

    const stream = await ensureMicrophoneAccess();
    const mimeType = getSupportedMimeType();
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

    audioChunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };
    recorder.onerror = () => {
      setErrorMessage("Recording failed. Please try again.");
      setIsRecording(false);
      setLiveStatus("Recorder error.");
      releaseMicrophone();
    };
    recorder.onstop = () => {
      const nextMimeType = recorder.mimeType || mimeType || "audio/webm";
      const blob = new Blob(audioChunksRef.current, { type: nextMimeType });
      audioChunksRef.current = [];
      releaseMicrophone();

      if (blob.size === 0) {
        setLiveStatus("No audio captured. Try again with a slightly longer hold.");
        return;
      }

      void processRecording(blob, nextMimeType);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
    setLiveStatus(interactionMode === "hold" ? "Recording. Release to send." : "Recording. Tap again to send.");

    if (interactionMode === "hold" && !holdPointerActiveRef.current) {
      stopRecording();
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return;
    }

    recorder.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setLiveStatus("Uploading recording...");
  };

  const handleTalkButtonClick = async () => {
    if (interactionMode === "hold") {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
      }
      return;
    }

    if (isRecording) {
      stopRecording();
      return;
    }

    try {
      await startRecording();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not start recording.");
    }
  };

  const handleHoldStart = async () => {
    if (interactionMode !== "hold") {
      return;
    }

    holdPointerActiveRef.current = true;

    try {
      await startRecording();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not start recording.");
    }
  };

  const handleHoldEnd = () => {
    holdPointerActiveRef.current = false;

    if (interactionMode !== "hold" || !isRecording) {
      return;
    }

    suppressClickRef.current = true;
    stopRecording();
  };

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_45%,#ffffff_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Mike voice prototype
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">Push-to-talk assistant</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Record a short utterance, send it to the assistant, review the transcript, and hear the reply back immediately. This route is isolated from the rest of the app.
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "w-fit rounded-full border px-3 py-1 text-xs font-medium shadow-sm",
              isRecording
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : isProcessing
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            {isRecording ? <Waves className="mr-1.5 h-3.5 w-3.5" /> : isProcessing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <AudioLines className="mr-1.5 h-3.5 w-3.5" />}
            {isRecording ? "Recording" : isProcessing ? "Processing" : "Ready"}
          </Badge>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <Card className="overflow-hidden border-slate-200 bg-white/85 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur">
            <CardHeader className="border-b border-slate-100 bg-white/80">
              <CardTitle>Voice controls</CardTitle>
              <CardDescription>Use hold mode for classic push-to-talk or switch to tap mode when you want explicit start and stop.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  className={cn(
                    "rounded-xl px-4 py-3 text-sm font-medium transition",
                    interactionMode === "hold" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600",
                  )}
                  onClick={() => setInteractionMode("hold")}
                  disabled={isRecording || isProcessing}
                >
                  Hold to talk
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded-xl px-4 py-3 text-sm font-medium transition",
                    interactionMode === "tap" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600",
                  )}
                  onClick={() => setInteractionMode("tap")}
                  disabled={isRecording || isProcessing}
                >
                  Tap to record
                </button>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-5">
                <button
                  type="button"
                  className={cn(
                    "group relative flex h-56 w-full flex-col items-center justify-center rounded-[1.75rem] border text-center transition duration-200",
                    isRecording
                      ? "border-rose-300 bg-rose-50 text-rose-700 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.08)]"
                      : "border-slate-200 bg-slate-950 text-white shadow-[0_24px_48px_-24px_rgba(15,23,42,0.6)] hover:-translate-y-0.5",
                    isProcessing && "cursor-wait opacity-80",
                  )}
                  onClick={() => void handleTalkButtonClick()}
                  onPointerDown={() => void handleHoldStart()}
                  onPointerUp={handleHoldEnd}
                  onPointerCancel={handleHoldEnd}
                  onPointerLeave={handleHoldEnd}
                  disabled={isProcessing || permissionState === "unsupported"}
                >
                  <div
                    className={cn(
                      "absolute inset-x-10 top-6 h-20 rounded-full blur-3xl transition",
                      isRecording ? "bg-rose-300/40" : "bg-sky-400/30",
                    )}
                  />
                  <div
                    className={cn(
                      "relative flex h-20 w-20 items-center justify-center rounded-full border",
                      isRecording ? "border-rose-200 bg-white text-rose-600" : "border-white/20 bg-white/10 text-white",
                    )}
                  >
                    {isRecording ? <Square className="h-8 w-8 fill-current" /> : <Mic className="h-8 w-8" />}
                  </div>
                  <div className="relative mt-5 space-y-2 px-6">
                    <p className="text-xl font-semibold">
                      {isRecording
                        ? "Listening"
                        : interactionMode === "hold"
                          ? "Press and hold"
                          : "Tap to start"}
                    </p>
                    <p className={cn("text-sm leading-6", isRecording ? "text-rose-700" : "text-slate-300")}>
                      {interactionMode === "hold"
                        ? "Hold the button while you speak, then release to send."
                        : isRecording
                          ? "Tap the same button again to stop and send."
                          : "Tap once to record, then tap again to send."}
                    </p>
                  </div>
                </button>
              </div>

              <Alert className="border-slate-200 bg-slate-50">
                {permissionState === "denied" || permissionState === "unsupported" ? (
                  <ShieldAlert className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
                <AlertTitle>Session status</AlertTitle>
                <AlertDescription>{liveStatus}</AlertDescription>
              </Alert>

              {permissionState === "idle" || permissionState === "prompt" ? (
                <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4 text-sm leading-6 text-sky-900">
                  The first recording attempt will trigger the browser microphone permission prompt.
                </div>
              ) : null}

              {permissionState === "denied" ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Microphone blocked</AlertTitle>
                  <AlertDescription>Allow microphone access in the browser site settings, then try again.</AlertDescription>
                </Alert>
              ) : null}

              {permissionState === "unsupported" ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Recording unavailable</AlertTitle>
                  <AlertDescription>This browser cannot capture microphone audio for the prototype.</AlertDescription>
                </Alert>
              ) : null}

              {errorMessage ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Voice exchange failed</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="border-slate-200 bg-white/90 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)]">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>Latest exchange</CardTitle>
                <CardDescription>The most recent transcript and assistant response are kept visible for quick QA.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 p-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Transcript</p>
                  <p className="mt-3 min-h-24 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {transcript || "Your speech transcription will appear here after the first recording."}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Assistant reply</p>
                  <p className="mt-3 min-h-24 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {responseText || "The assistant response will appear here, and its audio will autoplay when available."}
                  </p>
                </div>

                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Audio reply</p>
                      <p className="mt-2 text-sm text-slate-300">Playback is generated server-side with TTS for the assistant’s latest response.</p>
                    </div>
                    {responseAudioUrl ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="shrink-0 bg-white text-slate-950 hover:bg-slate-100"
                        onClick={() => {
                          if (!responseAudioRef.current) {
                            responseAudioRef.current = new Audio(responseAudioUrl);
                          }
                          void responseAudioRef.current.play();
                        }}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Replay
                      </Button>
                    ) : null}
                  </div>
                  <div className="mt-4">
                    {responseAudioUrl ? (
                      <audio controls className="w-full" src={responseAudioUrl}>
                        Your browser does not support the audio element.
                      </audio>
                    ) : (
                      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-400">
                        No response audio yet.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white/90 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)]">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>Conversation history</CardTitle>
                <CardDescription>The current browser session keeps a rolling transcript of both sides of the exchange.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {conversation.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                    No turns yet. Record a short prompt to start the session.
                  </div>
                ) : (
                  <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                    {conversation.map((turn) => (
                      <div
                        key={turn.id}
                        className={cn(
                          "rounded-2xl border px-4 py-3",
                          turn.role === "user"
                            ? "border-sky-100 bg-sky-50"
                            : "border-emerald-100 bg-emerald-50",
                        )}
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em]">
                          <span className={turn.role === "user" ? "text-sky-700" : "text-emerald-700"}>
                            {turn.role === "user" ? "You" : "Assistant"}
                          </span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{turn.text}</p>
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
