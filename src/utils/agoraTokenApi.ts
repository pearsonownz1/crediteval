import { publicEnv } from "@/lib/publicEnv";

export type AgoraTokenResponse = {
  appId: string;
  token: string;
  channelName: string;
  uid: number;
  expiresInSeconds: number;
  privilegeExpiredTs: number;
};

export async function fetchAgoraToken(channelName: string): Promise<AgoraTokenResponse> {
  const functionUrl = `${publicEnv.supabaseUrl}/functions/v1/generate-agora-token`;

  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publicEnv.supabaseAnonKey,
      Authorization: `Bearer ${publicEnv.supabaseAnonKey}`,
    },
    body: JSON.stringify({ channelName }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: `Agora token request failed with status ${response.status}` }));
    throw new Error(errorBody.error || "Failed to generate Agora token.");
  }

  return response.json();
}
