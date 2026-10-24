
import { pool } from "../../db/pool.js";
import type {
  RetrievalOptions,
  RetrievedChunk,
} from "./types.js";

interface DbChunk {
  chunk_id: string;
  document_id: string;
  filename: string;
  content: string;
  page_number: number | null;
  distance: number | string;
}

interface DbKeywordChunk {
  chunk_id: string;
  document_id: string;
  filename: string;
  content: string;
  page_number: number | null;
  keyword_score: number | string;
}

const RRF_K = 60;

function vectorString(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

function toRetrievedChunk(
  row: DbChunk,
  rank: number,
): RetrievedChunk {
  const distance = Number(row.distance);

  return {
    chunkId: row.chunk_id,
    documentId: row.document_id,
    filename: row.filename,
    content: row.content,
    pageNumber: row.page_number,
    similarity: Math.max(0, Math.min(1, 1 - distance)),
    retrievalScore: Math.max(0, 1 - distance),
    rank,
  };
}

async function vectorSearch(
  options: RetrievalOptions,
  chunkingStrategy: "fixed" | "semantic",
  limit = options.topK,
): Promise<RetrievedChunk[]> {
  const result = await pool.query<DbChunk>(
    `
      SELECT
        c.id::text AS chunk_id,
        c.document_id::text AS document_id,
        d.filename,
        c.content,
        c.page_number,
        c.embedding <=> $1::vector AS distance
      FROM chunks AS c
      INNER JOIN documents AS d ON d.id = c.document_id
      WHERE c.workspace_id = $2
        AND d.workspace_id = $2
        AND c.collection = 'workspace'
        AND d.collection = 'workspace'
        AND c.embedding IS NOT NULL
        AND c.chunking_strategy = $3
      ORDER BY c.embedding <=> $1::vector ASC
      LIMIT $4
    `,
    [
      vectorString(options.embedding),
      options.workspaceId,
      chunkingStrategy,
      limit,
    ],
  );

  return result.rows.map((row, index) =>
    toRetrievedChunk(row, index + 1),
  );
}

async function keywordSearch(
  options: RetrievalOptions,
  limit: number,
): Promise<DbKeywordChunk[]> {
  const result = await pool.query<DbKeywordChunk>(
    `
      SELECT
        c.id::text AS chunk_id,
        c.document_id::text AS document_id,
        d.filename,
        c.content,
        c.page_number,
        ts_rank_cd(
          to_tsvector('english', c.content),
          websearch_to_tsquery('english', $1)
        ) AS keyword_score
      FROM chunks AS c
      INNER JOIN documents AS d ON d.id = c.document_id
      WHERE c.workspace_id = $2
        AND d.workspace_id = $2
        AND c.collection = 'workspace'
        AND d.collection = 'workspace'
        AND c.chunking_strategy = 'fixed'
        AND to_tsvector('english', c.content)
            @@ websearch_to_tsquery('english', $1)
      ORDER BY keyword_score DESC
      LIMIT $3
    `,
    [options.question, options.workspaceId, limit],
  );

  return result.rows;
}

async function fixedVector(
  options: RetrievalOptions,
): Promise<RetrievedChunk[]> {
  return vectorSearch(options, "fixed");
}

async function semanticVector(
  options: RetrievalOptions,
): Promise<RetrievedChunk[]> {
  return vectorSearch(options, "semantic");
}

async function hybridRrf(
  options: RetrievalOptions,
): Promise<RetrievedChunk[]> {
  const candidateCount = Math.max(options.topK * 4, 20);

  const [vectorResults, keywordResults] = await Promise.all([
    vectorSearch(options, "fixed", candidateCount),
    keywordSearch(options, candidateCount),
  ]);

  const merged = new Map<
    string,
    {
      chunk: RetrievedChunk;
      score: number;
      vectorRank: number | null;
      keywordRank: number | null;
    }
  >();

  vectorResults.forEach((chunk, index) => {
    merged.set(chunk.chunkId, {
      chunk,
      score: 1 / (RRF_K + index + 1),
      vectorRank: index + 1,
      keywordRank: null,
    });
  });

  keywordResults.forEach((row, index) => {
    const rank = index + 1;
    const existing = merged.get(row.chunk_id);

    if (existing) {
      existing.score += 1 / (RRF_K + rank);
      existing.keywordRank = rank;
    } else {
      const chunk: RetrievedChunk = {
        chunkId: row.chunk_id,
        documentId: row.document_id,
        filename: row.filename,
        content: row.content,
        pageNumber: row.page_number,
        similarity: null,
        retrievalScore: 0,
        rank,
      };

      merged.set(row.chunk_id, {
        chunk,
        score: 1 / (RRF_K + rank),
        vectorRank: null,
        keywordRank: rank,
      });
    }
  });

  return [...merged.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, options.topK)
    .map((entry, index) => ({
      ...entry.chunk,
      retrievalScore: entry.score,
      rank: index + 1,
    }));
}

function lexicalScore(question: string, content: string): number {
  const tokenize = (text: string) =>
    text
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.filter((word) => word.length > 1) ?? [];

  const queryTokens = [...new Set(tokenize(question))];
  const contentTokens = new Set(tokenize(content));

  if (queryTokens.length === 0) return 0;

  const matches = queryTokens.filter((token) =>
    contentTokens.has(token),
  ).length;

  return matches / queryTokens.length;
}

async function vectorRerank(
  options: RetrievalOptions,
): Promise<RetrievedChunk[]> {
  const candidateCount = Math.max(options.topK * 4, 20);
  const candidates = await vectorSearch(
    options,
    "fixed",
    candidateCount,
  );

  return candidates
    .map((chunk) => {
      const lexical = lexicalScore(options.question, chunk.content);
      const vector = chunk.similarity ?? 0;

      // Simple heuristic blend; Day 4 will tell us whether it helps.
      const score = 0.7 * vector + 0.3 * lexical;

      return { ...chunk, retrievalScore: score };
    })
    .sort((a, b) => b.retrievalScore - a.retrievalScore)
    .slice(0, options.topK)
    .map((chunk, index) => ({ ...chunk, rank: index + 1 }));
}

export async function retrieveChunks(
  options: RetrievalOptions,
): Promise<RetrievedChunk[]> {
  switch (options.strategy) {
    case "fixed_vector":
      return fixedVector(options);

    case "semantic_vector":
      return semanticVector(options);

    case "hybrid_rrf":
      return hybridRrf(options);

    case "vector_rerank":
      return vectorRerank(options);

    default: {
      const exhaustive: never = options.strategy;
      throw new Error(`Unsupported retrieval strategy: ${exhaustive}`);
    }
  }
}
