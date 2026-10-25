import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../src/db/pool.js";
import { env } from "../src/config/env.js";
import { openai } from "../src/services/openai.js";
import { judgeAnswer } from "../src/services/evaluation/judge.js";
import type { JudgeResult } from "../src/services/evaluation/judge.js";
import {
  calculateRetrievalMetrics,
  calculateExpectedFactCoverage,
} from "../src/services/evaluation/metrics.js";
import { persistEvaluation } from "../src/services/evaluation/persistence.js";

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
  abstained?: boolean;
  sources: Array<{
    chunkId?: string;
    chunk_id?: string;
    id?: string;
  }>;
  metrics?: {
    retrievalMs?: number;
    generationMs?: number;
    totalMs?: number;
    promptTokens?: number | null;
    completionTokens?: number | null;
    estimatedCostUsd?: number | null;
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
  correctnessScore: number | null;
  faithfulnessScore: number | null;
  relevancyScore: number | null;
  failureType: string | null;
  correctAnswerWrongEvidence: boolean | null;
  judgeReason: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
}

async function loadEvidence(chunkIds: string[]): Promise<string[]> {
  if (chunkIds.length === 0) return [];

  const result = await pool.query<{
    id: string;
    filename: string;
    page_number: number | null;
    content: string;
  }>(
    `
      SELECT
        c.id::text AS id,
        d.filename,
        c.page_number,
        c.content
      FROM chunks c
      JOIN documents d ON d.id = c.document_id
      WHERE c.id::text = ANY($1::text[])
        AND c.workspace_id = $2
        AND d.workspace_id = $2
        AND c.collection = 'workspace'
        AND d.collection = 'workspace'
    `,
    [chunkIds, env.workspaceId],
  );

  //   byId stores a mapping between each chunk ID and its evidence text.
  const byId = new Map(
    result.rows.map((row) => [
      row.id,
      `${row.filename}${
        row.page_number != null ? ` (page ${row.page_number})` : ""
      }\n${row.content}`,
    ]),
  );

  // Preserve retrieval order so the judge sees evidence in ranking order.
  return chunkIds
    .map((id) => byId.get(id))
    .filter((value): value is string => Boolean(value));
}

async function main() {
  //   const mode = process.argv[2] ?? "development";

  type BenchmarkMode = "development" | "holdout";

  const mode: BenchmarkMode =
    process.argv[2] === "holdout" ? "holdout" : "development";

  if (process.argv[2] !== undefined && mode !== process.argv[2]) {
    throw new Error("Use: npm run benchmark:run -- development|holdout");
  }

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

      const evidence = await loadEvidence(retrievedIds);

      if (evidence.length === 0) {
        throw new Error(
          `No evidence found for question ${question.id} ` +
            `using strategy ${strategy}. Retrieved IDs: ` +
            JSON.stringify(retrievedIds),
        );
      }

      const judge: JudgeResult = await judgeAnswer({
        question: question.question,
        referenceAnswer: question.ground_truth_answer,
        generatedAnswer: data.answer,
        evidence,
      });

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
        correctnessScore: judge.correctness,
        faithfulnessScore: judge.faithfulness,
        relevancyScore: judge.relevancy,
        failureType: judge.failureType,
        correctAnswerWrongEvidence: judge.correctAnswerWrongEvidence,
        judgeReason: judge.reason,
        promptTokens: data.metrics?.promptTokens ?? null,
        completionTokens: data.metrics?.completionTokens ?? null,
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
      correctness: average(
        rows
          .map((r) => r.correctnessScore)
          .filter((v): v is number => v !== null),
      ),

      faithfulness: average(
        rows
          .map((r) => r.faithfulnessScore)
          .filter((v): v is number => v !== null),
      ),

      relevancy: average(
        rows
          .map((r) => r.relevancyScore)
          .filter((v): v is number => v !== null),
      ),
      failureCount: rows.filter(
        (r) => r.failureType !== null && r.failureType !== "none",
      ).length,
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

  const persistenceRecords = records.map((record) => {
    const question = result.rows.find((item) => item.id === record.questionId);

    if (!question) {
      throw new Error(`Missing question ${record.questionId}`);
    }

    return {
      ...record,
      referenceAnswer: question.ground_truth_answer,
    };
  });

  const experimentIds = await persistEvaluation({
    datasetVersion: "postgresql-v1",
    corpusVersion: "workspace-v1",
    mode,
    generationModel: process.env.OPENAI_GENERATION_MODEL ?? "gpt-4.1-mini",
    judgeModel:
      process.env.OPENAI_JUDGE_MODEL ??
      process.env.OPENAI_GENERATION_MODEL ??
      "gpt-4.1-mini",
    records: persistenceRecords,
  });

  console.log("Saved experiment IDs:", experimentIds);

  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exitCode = 1;
});
