import { getDocument, GlobalWorkerOptions, version } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export type ExtractedPdfData = {
  text: string;
  pageCount: number;
  pageSummaries: Array<{
    pageNumber: number;
    textLength: number;
  }>;
  previewImages: string[];
  extractionMethod: "text-layer" | "vision-fallback" | "mixed";
  textPreview: string;
  pdfjsVersion: string;
};

const MAX_TEXT_LENGTH = 24000;
const MAX_PREVIEW_PAGES = 3;
const IMAGE_SCALE = 1.5;
const PREVIEW_TEXT_LENGTH = 900;

const truncateText = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}\n…` : value;

const sanitizePageText = (text: string) =>
  text
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

export const extractPdfData = async (file: File): Promise<ExtractedPdfData> => {
  const buffer = await file.arrayBuffer();
  const loadingTask = getDocument({ data: buffer, useSystemFonts: true });
  const pdf = await loadingTask.promise;

  const pageTexts: string[] = [];
  const previewImages: string[] = [];
  const pageSummaries: ExtractedPdfData["pageSummaries"] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();

    const pageText = sanitizePageText(
      textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
    );

    pageTexts.push(pageText);
    pageSummaries.push({
      pageNumber,
      textLength: pageText.length,
    });

    if (pageNumber <= MAX_PREVIEW_PAGES) {
      const viewport = page.getViewport({ scale: IMAGE_SCALE });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Unable to create a canvas for PDF OCR preview rendering.");
      }

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      await page.render({ canvasContext: context, viewport }).promise;
      previewImages.push(canvas.toDataURL("image/jpeg", 0.82));
    }
  }

  const combinedText = sanitizePageText(pageTexts.filter(Boolean).join("\n\n--- Page Break ---\n\n"));
  const totalTextLength = combinedText.length;
  const pagesWithText = pageSummaries.filter((page) => page.textLength > 40).length;

  let extractionMethod: ExtractedPdfData["extractionMethod"] = "text-layer";
  if (!totalTextLength) {
    extractionMethod = "vision-fallback";
  } else if (pagesWithText < pdf.numPages) {
    extractionMethod = "mixed";
  }

  return {
    text: truncateText(combinedText, MAX_TEXT_LENGTH),
    pageCount: pdf.numPages,
    pageSummaries,
    previewImages,
    extractionMethod,
    textPreview: truncateText(combinedText, PREVIEW_TEXT_LENGTH),
    pdfjsVersion: version,
  };
};
