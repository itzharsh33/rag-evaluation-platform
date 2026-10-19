
import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  apiPort: Number(process.env.API_PORT ?? 4000),
  databaseUrl: required(
    "DATABASE_URL",
    "postgresql://rag_app:change_me_local_only@localhost:5432/rag_platform"
  ),
  workspaceId: process.env.WORKSPACE_ID ?? "default",
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000"
};
