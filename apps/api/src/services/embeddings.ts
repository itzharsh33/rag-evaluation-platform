
import { openai } from "./openai.js";
import { env } from "../config/env.js";

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const embeddings: number[][] = [];
  const batchSize = 64;

  for (let start = 0; start < texts.length; start += batchSize) {
    const batch = texts.slice(start, start + batchSize);

    const response = await openai.embeddings.create({
      model: env.embeddingModel,
      input: batch,
    });

    const ordered = [...response.data].sort(
      (a, b) => a.index - b.index,
    );

    for (const item of ordered) {
      if (item.embedding.length !== 1536) {
        throw new Error(
          `Expected 1536 embedding dimensions, received ${item.embedding.length}.`,
        );
      }

      embeddings.push(item.embedding);
    }
  }

  if (embeddings.length !== texts.length) {
    throw new Error("Embedding count does not match input count.");
  }

  return embeddings;
}
