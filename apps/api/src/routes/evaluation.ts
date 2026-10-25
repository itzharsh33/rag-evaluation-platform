import { Router } from "express";
import { pool } from "../db/pool.js";

export const evaluationRouter = Router();

evaluationRouter.get("/experiments", async (req, res, next) => {
  try {
    const requestedMode =
      typeof req.query.mode === "string" ? req.query.mode : null;

    if (
      requestedMode !== null &&
      !["development", "holdout"].includes(requestedMode)
    ) {
      res.status(400).json({
        error: "mode must be development or holdout.",
      });
      return;
    }

    const includeHistory = req.query.includeHistory === "true";

    const result = await pool.query(
      `
        WITH ranked_experiments AS (
          SELECT
            e.*,
            COALESCE(e.config_json->>'mode', 'unknown') AS experiment_mode,
            ROW_NUMBER() OVER (
              PARTITION BY
                e.strategy,
                COALESCE(e.config_json->>'mode', 'unknown')
              ORDER BY e.created_at DESC, e.id DESC
            ) AS run_rank
          FROM experiments e
        )
        SELECT
          e.id,
          e.dataset_version,
          e.corpus_version,
          e.strategy,
          e.config_json,
          e.experiment_mode AS mode,
          e.generation_model,
          e.judge_model,
          e.status,
          e.progress,
          e.error_message,
          e.started_at,
          e.finished_at,
          e.created_at,
          COALESCE(
            jsonb_object_agg(m.metric_name, m.metric_value)
              FILTER (WHERE m.metric_name IS NOT NULL),
            '{}'::jsonb
          ) AS metrics
        FROM ranked_experiments e
        LEFT JOIN metric_history m ON m.experiment_id = e.id
        WHERE
          ($1::text IS NULL OR e.experiment_mode = $1)
          AND ($2::boolean OR e.run_rank = 1)
        GROUP BY
            e.id,
            e.dataset_version,
            e.corpus_version,
            e.strategy,
            e.config_json,
            e.experiment_mode,
            e.generation_model,
            e.judge_model,
            e.status,
            e.progress,
            e.error_message,
            e.started_at,
            e.finished_at,
            e.created_at
        ORDER BY e.created_at DESC, e.id DESC
      `,
      [requestedMode, includeHistory],
    );

    res.json({
      experiments: result.rows,
      view: includeHistory ? "history" : "latest",
      mode: requestedMode ?? "all",
    });
  } catch (error) {
    next(error);
  }
});

evaluationRouter.get("/experiments/:id/results", async (req, res, next) => {
  try {
    const experiment = await pool.query(
      `SELECT id, dataset_version, corpus_version, strategy,
                status, progress, created_at, finished_at
         FROM experiments
         WHERE id = $1`,
      [req.params.id],
    );

    if (!experiment.rows[0]) {
      res.status(404).json({ error: "Experiment not found." });
      return;
    }

    const results = await pool.query(
      `
          
SELECT
  er.id,
  er.question_id,
  bq.question AS question,
  er.retrieved_chunks_json,
  er.generated_answer,
  er.expected_answer,
  er.retrieval_metrics_json,
  er.correctness_score,
  er.faithfulness_score,
  er.relevancy_score,
  er.latency_ms,
  er.token_usage_json,
  er.failure_type,
  er.correct_answer_wrong_evidence,
  er.judge_reason,
  er.created_at
FROM experiment_results er
LEFT JOIN benchmark_questions bq
  ON bq.id = er.question_id
WHERE er.experiment_id = $1
ORDER BY er.question_id

        `,
      [req.params.id],
    );

    res.json({
      experiment: experiment.rows[0],
      results: results.rows,
    });
  } catch (error) {
    next(error);
  }
});

evaluationRouter.get("/experiments/:id/failures", async (req, res, next) => {
  try {
    const result = await pool.query(
      `
          SELECT
  er.question_id,
  bq.question AS question,
  er.generated_answer,
  er.expected_answer,
  er.retrieved_chunks_json,
  er.retrieval_metrics_json,
  er.correctness_score,
  er.faithfulness_score,
  er.relevancy_score,
  er.failure_type,
  er.correct_answer_wrong_evidence,
  er.judge_reason
FROM experiment_results er
LEFT JOIN benchmark_questions bq
  ON bq.id = er.question_id
WHERE er.experiment_id = $1
  AND (
    er.failure_type IS DISTINCT FROM 'none'
    OR er.correct_answer_wrong_evidence IS TRUE
  )
ORDER BY er.correctness_score ASC NULLS FIRST
        `,
      [req.params.id],
    );

    res.json({ failures: result.rows });
  } catch (error) {
    next(error);
  }
});
