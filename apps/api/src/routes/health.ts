
import { Router } from "express";
import { pool } from "../db/pool.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  try {
    const result = await pool.query<{
      database_time: Date;
      vector_enabled: boolean;
    }>(`
      SELECT
        NOW() AS database_time,
        EXISTS (
          SELECT 1
          FROM pg_extension
          WHERE extname = 'vector'
        ) AS vector_enabled
    `);

    res.status(200).json({
      status: "ok",
      database: "connected",
      vectorExtensionEnabled: result.rows[0]?.vector_enabled ?? false,
      databaseTime: result.rows[0]?.database_time
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      status: "error",
      database: "unavailable"
    });
  }
});
