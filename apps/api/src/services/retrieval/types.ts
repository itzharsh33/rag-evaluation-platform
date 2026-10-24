
export type RetrievalStrategy =
  | "fixed_vector"
  | "semantic_vector"
  | "hybrid_rrf"
  | "vector_rerank";

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  filename: string;
  content: string;
  pageNumber: number | null;

  // Actual vector similarity, when vector search was used.
  similarity: number | null;

  // Strategy-specific score; not necessarily cosine similarity.
  retrievalScore: number;
  rank: number;
}

export interface RetrievalOptions {
  question: string;
  embedding: number[];
  workspaceId: string;
  topK: number;
  strategy: RetrievalStrategy;
}
