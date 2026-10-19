
import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";

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

app.use((_req, res) => {
  res.status(404).json({
    error: "Not found"
  });
});
