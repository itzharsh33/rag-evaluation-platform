
export interface TextChunk {
  index: number;
  content: string;
}

export function chunkText(
  text: string,
  chunkSize = 1000,
  overlap = 150,
): TextChunk[] {
  if (chunkSize <= 0) {
    throw new Error("chunkSize must be greater than zero.");
  }

  if (overlap < 0 || overlap >= chunkSize) {
    throw new Error("overlap must be non-negative and smaller than chunkSize.");
  }

  const normalized = text.trim();
  if (!normalized) return [];

  const chunks: TextChunk[] = [];
  const step = chunkSize - overlap;

  for (let start = 0; start < normalized.length; start += step) {
    const content = normalized.slice(start, start + chunkSize).trim();

    if (content) {
      chunks.push({
        index: chunks.length,
        content,
      });
    }

    if (start + chunkSize >= normalized.length) break;
  }

  return chunks;
}
