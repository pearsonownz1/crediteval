const AGORA_SDK_URL = "https://download.agora.io/sdk/release/AgoraRTC_N.js";
const AGORA_SCRIPT_ID = "agora-web-sdk";

export const AGORA_APP_ID = "f4ba30af745d4160979e5613b73fbe38";

export type AgoraUid = AgoraUID;
export type AgoraMediaType = "audio" | "video";
export type AgoraClient = AgoraRTCClient;
export type AgoraLocalAudioTrack = AgoraRTCAudioTrack;
export type AgoraLocalVideoTrack = AgoraRTCVideoTrack;
export type AgoraRemoteUser = AgoraRTCRemoteUser;
export type AgoraRtcSdk = AgoraRTCStatic;

let sdkPromise: Promise<AgoraRTCStatic> | null = null;

export async function loadAgoraRtcSdk(): Promise<AgoraRtcSdk> {
  if (typeof window === "undefined") {
    throw new Error("Agora can only be loaded in the browser.");
  }

  if (window.AgoraRTC) {
    return window.AgoraRTC;
  }

  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = new Promise<AgoraRtcSdk>((resolve, reject) => {
    const existingScript = document.getElementById(AGORA_SCRIPT_ID) as HTMLScriptElement | null;

    const resolveSdk = () => {
      if (!window.AgoraRTC) {
        reject(new Error("Agora Web SDK loaded but did not initialize."));
        return;
      }

      resolve(window.AgoraRTC);
    };

    if (existingScript) {
      existingScript.addEventListener("load", resolveSdk, { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Unable to load the Agora Web SDK.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = AGORA_SCRIPT_ID;
    script.src = AGORA_SDK_URL;
    script.async = true;
    script.onload = resolveSdk;
    script.onerror = () => reject(new Error("Unable to load the Agora Web SDK."));
    document.head.appendChild(script);
  }).catch((error) => {
    sdkPromise = null;
    throw error;
  });

  return sdkPromise;
}

export function getAgoraErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Unable to start the Agora session. Please try again.";
  }

  const normalized = error.message.toLowerCase();

  if (
    normalized.includes("permission") ||
    normalized.includes("notallowed") ||
    normalized.includes("denied") ||
    normalized.includes("securityerror")
  ) {
    return "Camera or microphone access was blocked. Allow permissions in the browser and try again.";
  }

  if (normalized.includes("token")) {
    return "This Agora project can require a valid token in secured environments. Supply one and try again.";
  }

  if (normalized.includes("notreadable")) {
    return "Your camera or microphone is already busy in another app. Close the other app and try again.";
  }

  if (normalized.includes("network") || normalized.includes("websocket") || normalized.includes("ice")) {
    return "The Agora SDK loaded, but the connection failed. Check network access and try again.";
  }

  return error.message;
}
