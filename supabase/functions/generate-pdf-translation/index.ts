import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAllowedCorsHeaders } from "../_shared/cors.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_TRANSLATION_MODEL") || "gpt-4.1-mini";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

interface TranslationRequestBody {
  fileName?: string;
  fileSize?: number;
  pageCount?: number;
  extractionMethod?: string;
  extractedText?: string;
  textPreview?: string;
  previewImages?: string[];
  pageSummaries?: Array<{
    pageNumber: number;
    textLength: number;
  }>;
  regenerate?: boolean;
}

const buildPrompt = (payload: TranslationRequestBody) => `
You are preparing a draft certified translation for a professional translation team.

Return strict JSON with this exact shape:
{
  "translation": string,
  "sourceSnippet": string,
  "summary": string,
  "detectedSourceLanguage": string,
  "extractionMethod": string,
  "notes": string[],
  "warnings": string[]
}

Rules:
- Translate the uploaded document into polished US English.
- Preserve document structure where practical using headings, labels, and line breaks.
- Include a translator certification block at the end suitable for internal drafting.
- If text is partially unreadable, mark uncertain sections with [illegible] or [unclear].
- Do not invent names, dates, numbers, seals, or registration values.
- If page images reveal text missing from extracted text, use the images to recover it.
- Keep the translation editable and natural, not robotic.
- sourceSnippet should be a concise excerpt of the recovered source text.
- summary should briefly describe the document type and translation confidence.
- notes should mention OCR/extraction observations that help a human reviewer.
- warnings should list any material limitations or ambiguities.

Document metadata:
- fileName: ${payload.fileName || "Unknown PDF"}
- fileSize: ${payload.fileSize || 0} bytes
- pageCount: ${payload.pageCount || 0}
- extractionMethod: ${payload.extractionMethod || "unknown"}
- regenerate: ${payload.regenerate ? "yes" : "no"}
- pageSummaries: ${JSON.stringify(payload.pageSummaries || [])}

Extracted text:
${payload.extractedText?.trim() || "[no extractable text provided]"}
`.trim();

const parseJsonResponse = (value: string) => {
  const normalized = value.trim();
  const fenced = normalized.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] || normalized;
  return JSON.parse(candidate);
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getAllowedCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY is not configured." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as TranslationRequestBody;

    if (!body.fileName || !body.pageCount) {
      return new Response(JSON.stringify({ error: "Missing PDF metadata for translation request." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!body.extractedText && (!body.previewImages || body.previewImages.length === 0)) {
      return new Response(JSON.stringify({ error: "No PDF text or preview images were provided for OCR/translation." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content: Array<Record<string, unknown>> = [
      {
        type: "input_text",
        text: buildPrompt(body),
      },
      ...(body.previewImages || []).map((imageUrl) => ({
        type: "input_image",
        image_url: imageUrl,
        detail: "high",
      })),
    ];

    const openAiResponse = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          {
            role: "user",
            content,
          },
        ],
      }),
    });

    if (!openAiResponse.ok) {
      const errorBody = await openAiResponse.text();
      console.error("OpenAI translation error:", errorBody);
      return new Response(JSON.stringify({ error: "OpenAI translation request failed." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = await openAiResponse.json();
    const outputText = raw.output_text;

    if (!outputText || typeof outputText !== "string") {
      console.error("Unexpected OpenAI response payload:", JSON.stringify(raw));
      return new Response(JSON.stringify({ error: "OpenAI did not return translation output." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = parseJsonResponse(outputText);

    return new Response(
      JSON.stringify({
        translation: parsed.translation || "",
        sourceSnippet: parsed.sourceSnippet || body.textPreview || "",
        summary: parsed.summary || "Draft translation generated from uploaded PDF.",
        detectedSourceLanguage: parsed.detectedSourceLanguage || "Unknown",
        extractionMethod: parsed.extractionMethod || body.extractionMethod || "unknown",
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
        model: OPENAI_MODEL,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("generate-pdf-translation failed", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Translation generation failed.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
