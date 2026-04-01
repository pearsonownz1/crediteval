import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
import { fetchAgoraToken } from "@/utils/agoraTokenApi";

export const DEFAULT_AGORA_CHANNEL = "crediteval-demo";

export type CallStatus = "idle" | "joining" | "joined" | "leaving";

export type RemoteParticipant = {
  uid: string;
  hasAudio: boolean;
  hasVideo: boolean;
  audioTrack?: AgoraRemoteUser["audioTrack"];
  videoTrack?: AgoraRemoteUser["videoTrack"];
};

type UseAgoraCallOptions = {
  initialChannel?: string;
  initialToken?: string;
  readyMessage?: string;
  joinedMessage?: (channel: string) => string;
  leftMessage?: string;
  failedMessage?: string;
};

function toParticipant(user: AgoraRemoteUser): RemoteParticipant {
  return {
    uid: String(user.uid),
    hasAudio: Boolean(user.hasAudio || user.audioTrack),
    hasVideo: Boolean(user.hasVideo || user.videoTrack),
    audioTrack: user.audioTrack,
    videoTrack: user.videoTrack,
  };
}

export function useAgoraCall(options: UseAgoraCallOptions = {}) {
  const {
    initialChannel = DEFAULT_AGORA_CHANNEL,
    initialToken = "",
    readyMessage = "Ready to join. Use a shared channel name so another participant can enter the same room.",
    joinedMessage = (channel: string) =>
      `Live in channel "${channel}". Share the same route and channel name with another participant.`,
    leftMessage = "Call ended. You can rejoin with the same channel or switch to a new one.",
    failedMessage = "Session setup failed. Review permissions, token, and network access, then try again.",
  } = options;

  const [channelName, setChannelName] = useState(initialChannel);
  const [token, setToken] = useState(initialToken);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState(readyMessage);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);

  const clientRef = useRef<AgoraClient | null>(null);
  const localAudioTrackRef = useRef<AgoraLocalAudioTrack | null>(null);
  const localVideoTrackRef = useRef<AgoraLocalVideoTrack | null>(null);
  const localVideoContainerRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const normalizedChannel = channelName.trim();
  const normalizedToken = token.trim();

  const isJoined = status === "joined";
  const isBusy = status === "joining" || status === "leaving";

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

  const joinCall = useCallback(async () => {
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

      const tokenToUse = normalizedToken || (await fetchAgoraToken(normalizedChannel)).token;
      await client.join(AGORA_APP_ID, normalizedChannel, tokenToUse || null, null);

      const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localAudioTrackRef.current = microphoneTrack;
      localVideoTrackRef.current = cameraTrack;

      if (localVideoContainerRef.current) {
        localVideoContainerRef.current.innerHTML = "";
        cameraTrack.play(localVideoContainerRef.current);
      }

      await client.publish([microphoneTrack, cameraTrack]);

      setIsMicEnabled(true);
      setIsCameraEnabled(true);
      setStatus("joined");
      setStatusMessage(joinedMessage(normalizedChannel));
    } catch (error) {
      await cleanupCall();
      setStatus("idle");
      setErrorMessage(getAgoraErrorMessage(error));
      setStatusMessage(failedMessage);
    }
  }, [cleanupCall, failedMessage, joinedMessage, normalizedChannel, normalizedToken, removeRemoteUser, upsertRemoteUser]);

  const leaveCall = useCallback(async () => {
    setStatus("leaving");
    await cleanupCall();
    setStatus("idle");
    setErrorMessage("");
    setStatusMessage(leftMessage);
  }, [cleanupCall, leftMessage]);

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

  return useMemo(
    () => ({
      channelName,
      setChannelName,
      token,
      setToken,
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
      joinCall,
      leaveCall,
      handleJoin: joinCall,
      handleLeave: leaveCall,
      toggleMicrophone,
      toggleCamera,
    }),
    [
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
      joinCall,
      leaveCall,
      toggleMicrophone,
      toggleCamera,
    ],
  );
}
