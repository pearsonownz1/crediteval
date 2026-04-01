import { publicEnv } from "@/lib/publicEnv";
import type { ExtractedPdfData } from "@/lib/pdfExtraction";

export type GeneratedTranslationResult = {
  translation: string;
  sourceSnippet: string;
  summary: string;
  detectedSourceLanguage: string;
  extractionMethod: string;
  notes: string[];
  warnings: string[];
  model: string;
};

export const generatePdfTranslation = async (
  file: File,
  extracted: ExtractedPdfData,
  options?: {
    regenerate?: boolean;
  }
): Promise<GeneratedTranslationResult> => {
  const functionUrl = `${publicEnv.supabaseUrl}/functions/v1/generate-pdf-translation`;

  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publicEnv.supabaseAnonKey,
      Authorization: `Bearer ${publicEnv.supabaseAnonKey}`,
    },
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      pageCount: extracted.pageCount,
      extractionMethod: extracted.extractionMethod,
      extractedText: extracted.text,
      textPreview: extracted.textPreview,
      previewImages: extracted.previewImages,
      pageSummaries: extracted.pageSummaries,
      regenerate: options?.regenerate ?? false,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({
      error: `Translation request failed with status ${response.status}`,
    }));

    throw new Error(errorBody.error || "Failed to generate translation.");
  }

  return response.json();
};
