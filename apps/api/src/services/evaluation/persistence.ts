import { pool } from "../../db/pool.js";
import type { JudgeResult } from "./judge.js";

export interface PersistedEvaluationRecord {
  questionId: string;
  strategy: string;
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
  referenceAnswer: string;
}

interface PersistOptions {
  datasetVersion: string;
  corpusVersion: string;
  mode: "development" | "holdout";
  generationModel: string;
  judgeModel: string;
  records: PersistedEvaluationRecord[];
}

const METRICS = [
  "recall_at_5",
  "mrr",
  "expected_fact_coverage",
  "correctness",
  "faithfulness",
  "relevancy",
  "latency_ms",
] as const;

export async function persistEvaluation(
  options: PersistOptions,
): Promise<string[]> {
  const strategies = [...new Set(options.records.map((r) => r.strategy))];
  const experimentIds: string[] = [];

  for (const strategy of strategies) {
    const rows = options.records.filter((r) => r.strategy === strategy);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const experimentResult = await client.query<{ id: string }>(
        `
          INSERT INTO experiments (
            dataset_version,
            corpus_version,
            strategy,
            config_json,
            generation_model,
            judge_model,
            status,
            progress,
            started_at,
            finished_at
          )
          VALUES (
            $1, $2, $3, $4::jsonb, $5, $6, 'running', 0,
            NOW(), NULL
          )
          RETURNING id::text AS id
        `,
        [
          options.datasetVersion,
          options.corpusVersion,
          strategy,
          JSON.stringify({
            mode: options.mode,
            topK: 5,
            questionCount: rows.length,
          }),
          options.generationModel,
          options.judgeModel,
        ],
      );

      const experimentId = experimentResult.rows[0]?.id;

      if (!experimentId) {
        throw new Error(`Could not create experiment for ${strategy}.`);
      }

      for (let index = 0; index < rows.length; index++) {
        const row = rows[index]!;

        await client.query(
          `
            INSERT INTO experiment_results (
              experiment_id,
              question_id,
              retrieved_chunks_json,
              generated_answer,
              expected_answer,
              retrieval_metrics_json,
              correctness_score,
              faithfulness_score,
              relevancy_score,
              latency_ms,
              token_usage_json,
              estimated_cost,
              failure_type,
              correct_answer_wrong_evidence,
              judge_reason
            )
            VALUES (
              $1, $2, $3::jsonb, $4, $5, $6::jsonb,
              $7, $8, $9, $10, $11::jsonb, NULL, $12, $13, $14
            )
          `,
          [
            experimentId,
            row.questionId,
            JSON.stringify(row.retrievedChunkIds),
            row.answer,
            row.referenceAnswer,
            JSON.stringify({
              recallAt5: row.recallAt5,
              reciprocalRank: row.reciprocalRank,
              expectedFactCoverage: row.expectedFactCoverage,
              retrievalMs: row.retrievalMs,
              generationMs: row.generationMs,
            }),
            row.correctnessScore,
            row.faithfulnessScore,
            row.relevancyScore,
            row.latencyMs,
            JSON.stringify({
              promptTokens: row.promptTokens,
              completionTokens: row.completionTokens,
            }),
            row.failureType,
            row.correctAnswerWrongEvidence,
            row.judgeReason,
          ],
        );

        await client.query(
          `UPDATE experiments SET progress = $2 WHERE id = $1`,
          [
            experimentId,
            Math.round(((index + 1) / rows.length) * 100),
          ],
        );
      }

      const average = (
        values: Array<number | null>,
      ): number | null => {
        const valid = values.filter(
          (value): value is number =>
            value !== null && Number.isFinite(value),
        );

        return valid.length
          ? valid.reduce((sum, value) => sum + value, 0) / valid.length
          : null;
      };

      const metricValues: Record<string, number | null> = {
        recall_at_5: average(rows.map((r) => r.recallAt5)),
        mrr: average(rows.map((r) => r.reciprocalRank)),
        expected_fact_coverage: average(
          rows.map((r) => r.expectedFactCoverage),
        ),
        correctness: average(rows.map((r) => r.correctnessScore)),
        faithfulness: average(rows.map((r) => r.faithfulnessScore)),
        relevancy: average(rows.map((r) => r.relevancyScore)),
        latency_ms: average(rows.map((r) => r.latencyMs)),
      };

      for (const metricName of METRICS) {
        const value = metricValues[metricName];

        if (value === null) continue;

        await client.query(
          `
            INSERT INTO metric_history (
              experiment_id, metric_name, metric_value
            )
            VALUES ($1, $2, $3)
          `,
          [experimentId, metricName, value],
        );
      }

      await client.query(
        `
          UPDATE experiments
          SET status = 'completed',
              progress = 100,
              finished_at = NOW()
          WHERE id = $1
        `,
        [experimentId],
      );

      await client.query("COMMIT");
      experimentIds.push(experimentId);
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  return experimentIds;
}