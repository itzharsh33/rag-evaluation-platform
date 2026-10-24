import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../src/db/pool.js";
import {
  calculateRetrievalMetrics,
  calculateExpectedFactCoverage,
} from "../src/services/evaluation/metrics.js";

const API_URL = process.env.BENCHMARK_API_URL ?? "http://localhost:4000";

const strategies = [
  "fixed_vector",
  "semantic_vector",
  "hybrid_rrf",
  "vector_rerank",
] as const;

interface QuestionRow {
  id: string;
  question: string;
  ground_truth_answer: string;
  relevant_chunk_ids: string[];
  relevant_semantic_chunk_ids: string[];
  expected_facts: string[];
  is_holdout: boolean;
}

interface RagResponse {
  answer: string;
  sources: Array<{
    chunkId?: string;
    chunk_id?: string;
    id?: string;
  }>;
  metrics?: {
    retrievalMs?: number;
    generationMs?: number;
    totalMs?: number;
  };
}

interface BenchmarkRecord {
  questionId: string;
  strategy: (typeof strategies)[number];
  answer: string;
  retrievedChunkIds: string[];
  recallAt5: number;
  reciprocalRank: number;
  expectedFactCoverage: number | null;
  latencyMs: number;
  retrievalMs: number | null;
  generationMs: number | null;
}

async function main() {
  const mode = process.argv[2] ?? "development";

  if (!["development", "holdout"].includes(mode)) {
    throw new Error("Use: npm run benchmark:run -- development|holdout");
  }

  const result = await pool.query<QuestionRow>(
    `SELECT id, question, ground_truth_answer,
            relevant_chunk_ids, relevant_semantic_chunk_ids, expected_facts, is_holdout
       FROM benchmark_questions
      WHERE dataset_version = $1
        AND is_holdout = $2
      ORDER BY id`,
    ["postgresql-v1", mode === "holdout"],
  );

  if (result.rows.length === 0) {
    throw new Error(`No ${mode} questions found. Check the benchmark import.`);
  }

  //   const records = [];
  const records: BenchmarkRecord[] = [];

  for (const question of result.rows) {
    for (const strategy of strategies) {
      console.log(`Question ${question.id}: ${strategy}`);

      const start = performance.now();

      const response = await fetch(`${API_URL}/api/rag/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.question,
          topK: 5,
          strategy,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `RAG API failed (${response.status}) for ${question.id}/${strategy}: ` +
            (await response.text()),
        );
      }

      const data = (await response.json()) as RagResponse;
      const clientLatencyMs = Math.round(performance.now() - start);

      const retrievedIds = data.sources
        .map((source) => source.chunkId ?? source.chunk_id ?? source.id)
        .filter((id): id is string => Boolean(id));

      if (retrievedIds.length !== data.sources.length) {
        throw new Error(
          "Could not identify chunk IDs in RAG response sources. " +
            "Check the source field names in rag.ts.",
        );
      }

      const relevantIds =
        strategy === "semantic_vector"
          ? question.relevant_semantic_chunk_ids
          : question.relevant_chunk_ids;

      if (!relevantIds || relevantIds.length === 0) {
        throw new Error(
          `Missing relevance labels for ${question.id}/${strategy}`,
        );
      }

      const retrieval = calculateRetrievalMetrics(retrievedIds, relevantIds, 5);

      const factCoverage = calculateExpectedFactCoverage(
        data.answer,
        question.expected_facts,
      );

      records.push({
        questionId: question.id,
        strategy,
        answer: data.answer,
        retrievedChunkIds: retrievedIds,
        recallAt5: retrieval.recallAt5,
        reciprocalRank: retrieval.reciprocalRank,
        expectedFactCoverage: factCoverage,
        latencyMs: clientLatencyMs,
        retrievalMs: data.metrics?.retrievalMs ?? null,
        generationMs: data.metrics?.generationMs ?? null,
      });
    }
  }

  const summary = strategies.map((strategy) => {
    const rows = records.filter((r) => r.strategy === strategy);
    const average = (values: number[]) =>
      values.length
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : null;

    return {
      strategy,
      questionCount: rows.length,
      recallAt5: average(rows.map((r) => r.recallAt5)),
      mrr: average(rows.map((r) => r.reciprocalRank)),
      expectedFactCoverage: average(
        rows
          .map((r) => r.expectedFactCoverage)
          .filter((v): v is number => v !== null),
      ),
      averageLatencyMs: average(rows.map((r) => r.latencyMs)),
    };
  });

  const output = {
    datasetVersion: "postgresql-v1",
    mode,
    createdAt: new Date().toISOString(),
    questionCount: result.rows.length,
    summaries: summary,
    results: records,
  };

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const outputDir = path.resolve(scriptDir, "../evaluation-results");
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `${mode}-results.json`);
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log("\nBenchmark summary:");
  console.table(summary);
  console.log(`Saved results to: ${outputPath}`);

  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exitCode = 1;
});
