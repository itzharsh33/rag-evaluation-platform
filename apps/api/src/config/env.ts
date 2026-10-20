
import "dotenv/config";
import path from "node:path";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  apiPort: Number(process.env.API_PORT ?? 4000),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://rag_app:change_me_local_only@localhost:5432/rag_platform",
  workspaceId: process.env.WORKSPACE_ID ?? "default",
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",

  uploadDir: path.resolve(process.env.UPLOAD_DIR ?? "uploads"),

  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  embeddingModel:
    process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
  generationModel:
    process.env.OPENAI_GENERATION_MODEL ?? "gpt-4.1-mini",

  maxUploadBytes: 10 * 1024 * 1024,
};
