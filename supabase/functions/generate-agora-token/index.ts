import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAllowedCorsHeaders } from "../_shared/cors.ts";
import { RtcRole, RtcTokenBuilder } from "npm:agora-token@2.0.5";

const APP_ID = Deno.env.get("VITE_AGORA_APP_ID") || "f4ba30af745d4160979e5613b73fbe38";
const APP_CERTIFICATE = Deno.env.get("AGORA_APP_CERTIFICATE");
const DEFAULT_TTL_SECONDS = 60 * 60;

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = {
    ...getAllowedCorsHeaders(origin),
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!APP_CERTIFICATE) {
    return new Response(JSON.stringify({ error: "AGORA_APP_CERTIFICATE is not configured." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const channelName = String(body.channelName || body.sessionId || "").trim();
    const uid = body.uid == null || body.uid === "" ? 0 : Number(body.uid);
    const expiresInSeconds = Math.max(60, Math.min(Number(body.expiresInSeconds) || DEFAULT_TTL_SECONDS, 60 * 60 * 12));

    if (!channelName) {
      return new Response(JSON.stringify({ error: "channelName is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const privilegeExpiredTs = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      Number.isFinite(uid) ? uid : 0,
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
    );

    return new Response(
      JSON.stringify({
        appId: APP_ID,
        token,
        channelName,
        uid: Number.isFinite(uid) ? uid : 0,
        expiresInSeconds,
        privilegeExpiredTs,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate Agora token." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
