import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { getAllowedCorsHeaders } from "../_shared/cors.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_BASE_URL = "https://api.openai.com/v1";
const TRANSCRIPTION_MODEL =
  Deno.env.get("OPENAI_TRANSCRIPTION_MODEL") ?? "gpt-4o-mini-transcribe";
const ASSISTANT_MODEL =
  Deno.env.get("OPENAI_VOICE_ASSISTANT_MODEL") ?? "gpt-4.1-mini";
const TTS_MODEL = Deno.env.get("OPENAI_TTS_MODEL") ?? "gpt-4o-mini-tts";
const TTS_VOICE = Deno.env.get("OPENAI_TTS_VOICE") ?? "alloy";
const SYSTEM_PROMPT =
  Deno.env.get("VOICE_ASSISTANT_SYSTEM_PROMPT") ??
  [
    "You are Mike's internal voice assistant for Crediteval.",
    "Be concise, helpful, and operationally practical.",
    "When the user asks about credential evaluation, translation, quotes, or order workflows, answer with clear next steps.",
    "If you are unsure, say so briefly instead of inventing details.",
  ].join(" ");

type ConversationTurn = {
  role: "user" | "assistant";
  text: string;
};

function parseHistory(raw: FormDataEntryValue | null): ConversationTurn[] {
  if (typeof raw !== "string" || !raw.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (entry): entry is ConversationTurn =>
          entry &&
          (entry.role === "user" || entry.role === "assistant") &&
          typeof entry.text === "string" &&
          entry.text.trim().length > 0,
      )
      .slice(-10);
  } catch (_error) {
    return [];
  }
}

async function transcribeAudio(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file, file.name || "voice-note.webm");
  formData.append("model", TRANSCRIPTION_MODEL);

  const response = await fetch(`${OPENAI_BASE_URL}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Transcription failed: ${errorText}`);
  }

  const data = await response.json();
  const transcript = typeof data.text === "string" ? data.text.trim() : "";

  if (!transcript) {
    throw new Error("The recording could not be transcribed.");
  }

  return transcript;
}

async function generateAssistantReply(
  transcript: string,
  history: ConversationTurn[],
): Promise<string> {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((turn) => ({
      role: turn.role,
      content: turn.text,
    })),
    { role: "user", content: transcript },
  ];

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ASSISTANT_MODEL,
      messages,
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Assistant response failed: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const text = content
      .map((part) =>
        typeof part?.text === "string"
          ? part.text
          : typeof part?.content === "string"
            ? part.content
            : "",
      )
      .join(" ")
      .trim();
    if (text) {
      return text;
    }
  }

  throw new Error("Assistant returned an empty response.");
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let index = 0; index < bytes.byteLength; index += 0x8000) {
    const chunk = bytes.subarray(index, index + 0x8000);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

async function synthesizeSpeech(text: string) {
  const response = await fetch(`${OPENAI_BASE_URL}/audio/speech`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TTS_MODEL,
      voice: TTS_VOICE,
      input: text,
      format: "mp3",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Speech synthesis failed: ${errorText}`);
  }

  const audioBuffer = await response.arrayBuffer();

  return {
    audioBase64: arrayBufferToBase64(audioBuffer),
    audioMimeType: "audio/mpeg",
  };
}

serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getAllowedCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY is not configured." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("audio");
    const history = parseHistory(formData.get("history"));

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: "Audio recording is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transcript = await transcribeAudio(file);
    const responseText = await generateAssistantReply(transcript, history);
    const speech = await synthesizeSpeech(responseText);

    return new Response(
      JSON.stringify({
        transcript,
        responseText,
        audioBase64: speech.audioBase64,
        audioMimeType: speech.audioMimeType,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("voice-assistant error", message);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
