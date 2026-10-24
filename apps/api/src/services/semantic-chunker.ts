
export interface SemanticChunk {
  index: number;
  content: string;
}

export function semanticChunkText(
  text: string,
  maxChunkSize = 1200,
  minChunkSize = 300,
): SemanticChunk[] {
  if (maxChunkSize <= 0) {
    throw new Error("maxChunkSize must be positive");
  }

  if (minChunkSize <= 0 || minChunkSize > maxChunkSize) {
    throw new Error("minChunkSize must be between 1 and maxChunkSize");
  }

  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  if (!normalized) return [];

  // Paragraphs are our preferred boundaries.
  const paragraphs = normalized
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  // Keep oversized paragraphs manageable by splitting them into sentences.
  const units: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxChunkSize) {
      units.push(paragraph);
      continue;
    }

    const sentences =
      paragraph.match(/[^.!?]+(?:[.!?]+["')\]]*|$)/g) ?? [paragraph];

    for (const sentence of sentences) {
      const cleaned = sentence.trim();
      if (!cleaned) continue;

      if (cleaned.length <= maxChunkSize) {
        units.push(cleaned);
        continue;
      }

      // Last-resort split for a single extremely long sentence.
      for (let start = 0; start < cleaned.length; start += maxChunkSize) {
        units.push(cleaned.slice(start, start + maxChunkSize).trim());
      }
    }
  }

  const result: SemanticChunk[] = [];
  let current = "";

  for (const unit of units) {
    const candidate = current ? `${current}\n\n${unit}` : unit;

    if (candidate.length <= maxChunkSize) {
      current = candidate;
      continue;
    }

    if (current) {
      result.push({ index: result.length, content: current });
    }

    current = unit;
  }

  if (current) {
    result.push({ index: result.length, content: current });
  }

  // Merge a small final chunk into its predecessor when possible.
  if (result.length > 1) {
    const last = result[result.length - 1];
    const previous = result[result.length - 2];

    if (
        last&&
        previous&&
      last.content.length < minChunkSize &&
      previous.content.length + 2 + last.content.length <= maxChunkSize
    ) {
      previous.content += `\n\n${last.content}`;
      result.pop();
    }
  }

  // Reassign indices after any merge.
  return result.map((chunk, index) => ({ ...chunk, index }));
}
