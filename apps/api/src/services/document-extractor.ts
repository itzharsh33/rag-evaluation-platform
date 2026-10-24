
import fs from "node:fs/promises";
import mammoth from "mammoth";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

interface PdfTextItem {
  str?: string;
}

interface PdfPageData {
  getTextContent: () => Promise<{
    items: PdfTextItem[];
  }>;
}

interface PdfOptions {
  pagerender?: (page: PdfPageData) => Promise<string>;
}

const pdf = require("pdf-parse") as (
  buffer: Buffer,
  options?: PdfOptions,
) => Promise<{
  text: string;
  numpages: number;
}>;

export interface ExtractedPage {
  pageNumber: number | null;
  text: string;
}

export interface ExtractedDocument {
  pages: ExtractedPage[];
  pageCount: number;
}

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractDocumentText(
  filePath: string,
  mimeType: string,
): Promise<ExtractedDocument> {
  const buffer = await fs.readFile(filePath);

  let pages: ExtractedPage[] = [];
  let pageCount = 0;

  if (mimeType === "application/pdf") {
    let currentPage = 0;

    const result = await pdf(buffer, {
      pagerender: async (page) => {
        currentPage++;

        const content = await page.getTextContent();
        const pageText = cleanText(
          content.items
            .map((item) => item.str ?? "")
            .join(" "),
        );

        pages.push({
          pageNumber: currentPage,
          text: pageText,
        });

        return pageText;
      },
    });

    pageCount = result.numpages;
  } else if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });

    // DOCX extraction doesn't preserve reliable PDF-style page numbers.
    pages = [
      {
        pageNumber: null,
        text: cleanText(result.value),
      },
    ];
  } else {
    throw new Error("Only PDF and DOCX files are supported.");
  }

  pages = pages.filter((page) => page.text.length > 0);

  if (pages.length === 0) {
    throw new Error(
      "No readable text found. Scanned PDFs may require OCR, which is not supported yet.",
    );
  }

  return {
    pages,
    pageCount,
  };
}
