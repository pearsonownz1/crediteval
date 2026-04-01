type AgoraUID = string | number;

interface AgoraRTCTrack {
  setEnabled(enabled: boolean): Promise<void>;
  stop(): void;
  close(): void;
}

interface AgoraRTCVideoTrack extends AgoraRTCTrack {
  play(element: string | HTMLElement): void;
}

interface AgoraRTCAudioTrack extends AgoraRTCTrack {
  play(): void;
}

interface AgoraRTCRemoteUser {
  uid: AgoraUID;
  audioTrack?: AgoraRTCAudioTrack;
  videoTrack?: AgoraRTCVideoTrack;
  hasAudio?: boolean;
  hasVideo?: boolean;
}

interface AgoraRTCClient {
  join(
    appId: string,
    channel: string,
    token: string | null,
    uid?: AgoraUID | null,
  ): Promise<AgoraUID>;
  leave(): Promise<void>;
  publish(tracks: AgoraRTCTrack[]): Promise<void>;
  subscribe(
    user: AgoraRTCRemoteUser,
    mediaType: "audio" | "video",
  ): Promise<void>;
  removeAllListeners(): void;
  on(
    event: "user-published",
    listener: (
      user: AgoraRTCRemoteUser,
      mediaType: "audio" | "video",
    ) => void | Promise<void>,
  ): void;
  on(
    event: "user-unpublished",
    listener: (
      user: AgoraRTCRemoteUser,
      mediaType: "audio" | "video",
    ) => void | Promise<void>,
  ): void;
  on(event: "user-left", listener: (user: AgoraRTCRemoteUser) => void): void;
}

interface AgoraRTCStatic {
  createClient(config: { mode: "rtc"; codec: "vp8" | "h264" }): AgoraRTCClient;
  createMicrophoneAndCameraTracks(): Promise<
    [AgoraRTCAudioTrack, AgoraRTCVideoTrack]
  >;
}

interface Window {
  AgoraRTC?: AgoraRTCStatic;
}
