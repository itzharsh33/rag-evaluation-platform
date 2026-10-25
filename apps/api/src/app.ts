
import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { documentsRouter } from "./routes/documents.js";
import { ragRouter } from "./routes/rag.js";
import { evaluationRouter } from "./routes/evaluation.js";

export const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin: env.frontendOrigin
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/api", (_req, res) => {
  res.json({
    name: "RAG Evaluation Platform API",
    version: "1.0.0"
  });
});

app.use("/api/health", healthRouter);

app.use("/api/documents", documentsRouter);

app.use("/api/rag", ragRouter);

app.use("/api/evaluation", evaluationRouter);

app.use((_req, res) => {
  res.status(404).json({
    error: "Not found"
  });
});


app.use(
  (
    error: Error & { status?: number },
    _req: import("express").Request,
    res: import("express").Response,
    _next: import("express").NextFunction,
  ) => {
    console.error("API request failed:", error.message);

    const status = error.status ?? 500;

    res.status(status).json({
      error:
        status < 500
          ? error.message
          : "An internal server error occurred.",
    });
  },
);