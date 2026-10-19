
"use client";

import { useState } from "react";

type HealthResponse = {
  status: string;
  database: string;
  vectorExtensionEnabled: boolean;
  databaseTime?: string;
};

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkConnection() {
    setLoading(true);
    setError(null);
    setHealth(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/health`);

      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`);
      }

      const data = (await response.json()) as HealthResponse;
      setHealth(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not connect to the API"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
        Day 1 · Foundation
      </p>

      <h1 className="text-4xl font-bold tracking-tight">
        RAG Evaluation &amp; Optimization Platform
      </h1>

      <p className="text-gray-600">
        A platform to chat with documents, compare retrieval strategies, and
        measure RAG quality.
      </p>

      <div className="rounded-xl border p-6">
        <h2 className="text-xl font-semibold">Infrastructure check</h2>
        <p className="mt-2 text-sm text-gray-600">
          Verify that the frontend can reach Express and PostgreSQL.
        </p>

        <button
          onClick={checkConnection}
          disabled={loading}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Checking..." : "Check API and database"}
        </button>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            Connection failed: {error}
          </p>
        )}

        {health && (
          <pre className="mt-4 overflow-x-auto rounded-lg bg-gray-100 p-4 text-sm text-gray-900">
            {JSON.stringify(health, null, 2)}
          </pre>
        )}
      </div>
    </main>
  );
}
