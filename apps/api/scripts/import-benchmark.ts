import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../src/db/pool.js";

interface BenchmarkQuestion {
  id: string;
  dataset_version: string;
  question: string;
  ground_truth_answer: string;
  relevant_document_ids: string[];
  relevant_chunk_ids: string[];
  relevant_semantic_chunk_ids?: string[];
  evidence_snippet: string;
  expected_facts: string[];
  category: string;
  is_holdout: boolean;
}

interface BenchmarkFile {
  dataset_version: string;
  corpus_version: string;
  question_count: number;
  questions: BenchmarkQuestion[];
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.resolve(
  scriptDir,
  "../postgresql_benchmark_50_resolved.json",
);

async function main() {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as BenchmarkFile;

  if (data.questions.length !== 50) {
    throw new Error(`Expected 50 questions, received ${data.questions.length}`);
  }

  for (const q of data.questions) {
    if (
      !q.id ||
      !q.question ||
      !q.ground_truth_answer ||
      !q.relevant_chunk_ids?.length
    ) {
      throw new Error(`Question ${q.id || "(missing ID)"} is incomplete`);
    }

    if (
      q.relevant_semantic_chunk_ids !== undefined &&
      q.relevant_semantic_chunk_ids.length === 0
    ) {
      throw new Error(
        `Question ${q.id} has an empty semantic relevance label array`,
      );
    }
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO benchmark_datasets
         (dataset_version, corpus_version, question_count)
       VALUES ($1, $2, $3)
       ON CONFLICT (dataset_version)
       DO UPDATE SET
         corpus_version = EXCLUDED.corpus_version,
         question_count = EXCLUDED.question_count`,
      [data.dataset_version, data.corpus_version, data.questions.length],
    );

    for (const q of data.questions) {
      await client.query(
        `INSERT INTO benchmark_questions (
      id, dataset_version, question, ground_truth_answer,
      relevant_document_ids, relevant_chunk_ids,
      relevant_semantic_chunk_ids,
      evidence_snippet, expected_facts, category, is_holdout
    )
    VALUES (
      $1, $2, $3, $4, $5::jsonb, $6::jsonb,
      $7::jsonb, $8, $9::jsonb, $10, $11
    )
    ON CONFLICT (id) DO UPDATE SET
      dataset_version = EXCLUDED.dataset_version,
      question = EXCLUDED.question,
      ground_truth_answer = EXCLUDED.ground_truth_answer,
      relevant_document_ids = EXCLUDED.relevant_document_ids,
      relevant_chunk_ids = EXCLUDED.relevant_chunk_ids,
      relevant_semantic_chunk_ids =
        CASE
          WHEN $12::boolean
          THEN EXCLUDED.relevant_semantic_chunk_ids
          ELSE benchmark_questions.relevant_semantic_chunk_ids
        END,
      evidence_snippet = EXCLUDED.evidence_snippet,
      expected_facts = EXCLUDED.expected_facts,
      category = EXCLUDED.category,
      is_holdout = EXCLUDED.is_holdout`,
        [
          q.id,
          q.dataset_version,
          q.question,
          q.ground_truth_answer,
          JSON.stringify(q.relevant_document_ids),
          JSON.stringify(q.relevant_chunk_ids),
          JSON.stringify(q.relevant_semantic_chunk_ids ?? []),
          q.evidence_snippet,
          JSON.stringify(q.expected_facts),
          q.category,
          q.is_holdout,
          q.relevant_semantic_chunk_ids !== undefined,
        ],
      );
    }

    await client.query("COMMIT");
    console.log(`Imported ${data.questions.length} benchmark questions.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Benchmark import failed:", error);
  process.exitCode = 1;
});
