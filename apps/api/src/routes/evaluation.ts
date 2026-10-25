import { Router } from "express";
import { pool } from "../db/pool.js";

export const evaluationRouter = Router();

evaluationRouter.get("/experiments", async (_req, res, next) => {
  try {
    const result = await pool.query(
      `
        SELECT
          e.id,
          e.dataset_version,
          e.corpus_version,
          e.strategy,
          e.config_json,
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
        FROM experiments e
        LEFT JOIN metric_history m ON m.experiment_id = e.id
        GROUP BY e.id
        ORDER BY e.created_at DESC
      `,
    );

    res.json({ experiments: result.rows });
  } catch (error) {
    next(error);
  }
});

evaluationRouter.get(
  "/experiments/:id/results",
  async (req, res, next) => {
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
            id,
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
            failure_type,
            correct_answer_wrong_evidence,
            judge_reason,
            created_at
          FROM experiment_results
          WHERE experiment_id = $1
          ORDER BY question_id
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
  },
);

evaluationRouter.get(
  "/experiments/:id/failures",
  async (req, res, next) => {
    try {
      const result = await pool.query(
        `
          SELECT
            question_id,
            generated_answer,
            expected_answer,
            retrieved_chunks_json,
            retrieval_metrics_json,
            correctness_score,
            faithfulness_score,
            relevancy_score,
            failure_type,
            correct_answer_wrong_evidence,
            judge_reason
          FROM experiment_results
          WHERE experiment_id = $1
            AND (
              failure_type IS DISTINCT FROM 'none'
              OR correct_answer_wrong_evidence IS TRUE
            )
          ORDER BY correctness_score ASC NULLS FIRST
        `,
        [req.params.id],
      );

      res.json({ failures: result.rows });
    } catch (error) {
      next(error);
    }
  },
);