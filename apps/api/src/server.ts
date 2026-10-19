
import { app } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";

const server = app.listen(env.apiPort, "0.0.0.0", () => {
  console.log(`API listening on port ${env.apiPort}`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`${signal} received; shutting down`);

  server.close(async () => {
    try {
      await pool.end();
      process.exit(0);
    } catch (error) {
      console.error("Shutdown failed:", error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
