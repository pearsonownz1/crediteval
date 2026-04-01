import { DEFAULT_AGORA_CHANNEL } from "@/hooks/useAgoraCall";

export const SESSION_ID_PARAM = "session";
export const SESSION_NAME_PARAM = "name";
export const SESSION_TOKEN_PARAM = "token";
export const CHANNEL_PARAM = "channel";

const SESSION_ID_FALLBACK = "review-room";

export function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().split("-")[0];
  }

  return Math.random().toString(36).slice(2, 10);
}

export function normalizeSessionId(value: string | null | undefined) {
  const normalized = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return normalized || SESSION_ID_FALLBACK;
}

export function normalizeSessionName(value: string | null | undefined, sessionId: string) {
  const normalized = (value ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  return normalized || `Review ${sessionId.toUpperCase()}`;
}

export function resolveSession(searchParams: URLSearchParams) {
  const sessionId = normalizeSessionId(
    searchParams.get(SESSION_ID_PARAM) || searchParams.get(CHANNEL_PARAM) || DEFAULT_AGORA_CHANNEL,
  );
  const sessionName = normalizeSessionName(searchParams.get(SESSION_NAME_PARAM), sessionId);
  const token = (searchParams.get(SESSION_TOKEN_PARAM) || "").trim();

  return {
    sessionId,
    sessionName,
    token,
    channelName: sessionId,
  };
}

export function buildSessionSearchParams(
  sessionId: string,
  sessionName: string,
  token?: string,
): Record<string, string> {
  const params: Record<string, string> = {
    [SESSION_ID_PARAM]: normalizeSessionId(sessionId),
    [SESSION_NAME_PARAM]: normalizeSessionName(sessionName, sessionId),
  };

  const normalizedToken = (token ?? "").trim();

  if (normalizedToken) {
    params[SESSION_TOKEN_PARAM] = normalizedToken;
  }

  return params;
}

export function buildPdfSessionPath(sessionId: string, sessionName: string, token?: string) {
  return `/pdf?${new URLSearchParams(buildSessionSearchParams(sessionId, sessionName, token)).toString()}`;
}

export function buildCallSessionPath(sessionId: string, sessionName: string, token?: string) {
  const params = new URLSearchParams(buildSessionSearchParams(sessionId, sessionName, token));
  params.set(CHANNEL_PARAM, normalizeSessionId(sessionId));
  return `/call?${params.toString()}`;
}
