"use client";

import { useCallback, useEffect, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type DocumentItem = {
  id: string;
  filename: string;
  status?: string;
  chunk_count?: number;
  page_count?: number | null;
  created_at?: string;
};

type RetrievalStrategy =
  | "fixed_vector"
  | "semantic_vector"
  | "hybrid_rrf"
  | "vector_rerank";

type Source = {
  citation: string;
  chunkId: string;
  documentId: string;
  filename: string;
  pageNumber: number | null;
  similarity: number;
};

type QueryResponse = {
  answer: string;
  abstained: boolean;
  strategy?: RetrievalStrategy;
  sources: Source[];
  metrics: {
    embeddingMs: number;
    retrievalMs: number;
    generationMs: number;
    totalMs: number;
    promptTokens: number | null;
    completionTokens: number | null;
    estimatedCostUsd: number | null;
  };
};

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return typeof body.error === "string" ? body.error : "The request failed.";
  } catch {
    return "The server returned an invalid response.";
  }
}

export default function Home() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [question, setQuestion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<QueryResponse | null>(null);

  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [strategy, setStrategy] = useState<RetrievalStrategy>("fixed_vector");

  const loadDocuments = useCallback(async () => {
    setLoadingDocuments(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents`);

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const data = await response.json();

      // Supports either an array or { documents: [...] } response.
      const items = Array.isArray(data) ? data : data.documents;

      if (!Array.isArray(items)) {
        throw new Error("Unexpected document-list response.");
      }

      setDocuments(items);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load documents.",
      );
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Choose a PDF or DOCX file first.");
      return;
    }

    const formElement = event.currentTarget;
    const selectedFile = file;

    setUploading(true);
    setError("");
    setNotice("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const data = await response.json();
      const documentId = data?.document?.id as string | undefined;

      setFile(null);
      formElement.reset();

      if (!documentId) {
        setNotice(
          `Uploaded ${selectedFile.name}, but the server did not return a document ID. Semantic indexing was not started.`,
        );
        setError(
          "Could not start semantic indexing because the document ID is missing.",
        );
        await loadDocuments();
        return;
      }

      // Fixed chunking has completed. Now index semantic chunks automatically.
      setNotice(
        `Uploaded ${selectedFile.name}. Fixed indexing completed; creating semantic chunks...`,
      );

      try {
        const semanticResponse = await fetch(
          `${API_BASE_URL}/api/documents/${encodeURIComponent(documentId)}/index-semantic`,
          { method: "POST" },
        );

        if (!semanticResponse.ok) {
          throw new Error(await readError(semanticResponse));
        }

        const semanticData = await semanticResponse.json();

        setNotice(
          `Uploaded ${selectedFile.name} successfully. Fixed chunks: ${
            data.document.chunkCount
          }; semantic chunks: ${semanticData.chunksCreated}.`,
        );
      } catch (semanticError) {
        setError(
          `The document and fixed chunks were saved, but semantic indexing failed: ${
            semanticError instanceof Error
              ? semanticError.message
              : "Unknown error"
          }. Retry semantic indexing for this document.`,
        );
      }

      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Document upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleAsk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError("Enter a question first.");
      return;
    }

    if (documents.length === 0) {
      setError("Upload at least one document before asking.");
      return;
    }

    setAsking(true);
    setError("");
    setNotice("");
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/rag/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Approach A: no documentIds are sent.
        body: JSON.stringify({
          question: trimmedQuestion,
          topK: 5,
          strategy,
        }),
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const data: QueryResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not get an answer.");
    } finally {
      setAsking(false);
    }
  }

  async function handleDelete(document: DocumentItem) {
    const confirmed = window.confirm(
      `Delete "${document.filename}" and its stored chunks?`,
    );

    if (!confirmed) return;

    setDeletingId(document.id);
    setError("");
    setNotice("");
    setResult(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/documents/${encodeURIComponent(document.id)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      setNotice(`Deleted ${document.filename}.`);
      await loadDocuments();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete the document.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            RAG Evaluation Platform
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Chat with your documents
          </h1>

          <p className="max-w-2xl text-slate-600">
            Upload PDF or DOCX files, ask questions, and inspect the evidence
            retrieved by your RAG system.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <div className="flex items-start justify-between gap-3">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setError("")}
                className="font-semibold"
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            {notice}
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">1. Upload a document</h2>
            <p className="mt-1 text-sm text-slate-600">
              Supported formats: PDF and DOCX. Maximum file size: 10 MB.
            </p>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              disabled={uploading}
              className="block w-full rounded-lg border border-slate-300 p-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-medium file:text-blue-700"
            />

            {file && (
              <p className="text-sm text-slate-600">Selected: {file.name}</p>
            )}

            <button
              type="submit"
              disabled={uploading || !file}
              className="rounded-lg bg-blue-700 px-5 py-2.5 font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? "Uploading and processing..." : "Upload document"}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">2. Your documents</h2>
              <p className="mt-1 text-sm text-slate-600">
                Questions search across all documents in the configured
                workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadDocuments()}
              disabled={loadingDocuments}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              {loadingDocuments ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loadingDocuments ? (
            <p className="text-sm text-slate-500">Loading documents...</p>
          ) : documents.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              No documents uploaded yet. Upload a PDF or DOCX to get started.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {documents.map((document) => (
                <li
                  key={document.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-medium">
                      {document.filename}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {document.chunk_count ?? 0} chunks
                      {document.page_count != null
                        ? ` · ${document.page_count} pages`
                        : ""}
                      {document.status ? ` · ${document.status}` : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleDelete(document)}
                    disabled={deletingId === document.id}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === document.id ? "Deleting..." : "Delete"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">3. Ask a question</h2>
            <p className="mt-1 text-sm text-slate-600">
              You do not need to select documents. Retrieval happens
              automatically.
            </p>
          </div>

          <form onSubmit={handleAsk} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="retrieval-strategy"
                className="block text-sm font-medium"
              >
                Retrieval method
              </label>

              <select
                id="retrieval-strategy"
                value={strategy}
                onChange={(event) =>
                  setStrategy(event.target.value as RetrievalStrategy)
                }
                disabled={asking}
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                <option value="fixed_vector">Fixed Vector Search</option>
                <option value="semantic_vector">Semantic Vector Search</option>
                <option value="hybrid_rrf">Hybrid Search (RRF)</option>
                <option value="vector_rerank">
                  Vector Search + Re-ranking
                </option>
              </select>

              <p className="text-xs text-slate-500">
                This method determines which document chunks are retrieved
                before the AI generates its answer.
              </p>
            </div>

            <label htmlFor="question" className="block text-sm font-medium">
              Your question
            </label>

            <textarea
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="For example: What is the leave policy?"
              rows={4}
              maxLength={4000}
              className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Searches all workspace documents · Top 5 chunks
              </p>

              <button
                type="submit"
                disabled={asking || !question.trim() || documents.length === 0}
                className="rounded-lg bg-blue-700 px-5 py-2.5 font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {asking ? "Searching and generating..." : "Ask question"}
              </button>
            </div>
          </form>
        </section>

        {result && (
          <section className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">Answer</h2>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
                  Retrieval: {result.strategy ?? strategy}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    result.abstained
                      ? "bg-amber-100 text-amber-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {result.abstained ? "Insufficient evidence" : "Generated"}
                </span>
              </div>

              <p className="whitespace-pre-wrap leading-7 text-slate-800">
                {result.answer}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-xl font-semibold">
                Retrieved sources ({result.sources.length})
              </h2>

              {result.sources.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No supporting sources were returned for this answer.
                </p>
              ) : (
                <ul className="space-y-4">
                  {result.sources.map((source) => (
                    <li
                      key={source.chunkId}
                      className="rounded-lg border border-slate-200 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800">
                          [{source.citation}]
                        </span>

                        <span className="text-xs text-slate-500">
                          Similarity:{" "}
                          {Number.isFinite(source.similarity)
                            ? source.similarity.toFixed(4)
                            : "N/A"}
                        </span>
                      </div>

                      <p className="mt-2 break-words font-medium">
                        {source.filename}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Page: {source.pageNumber ?? "Unknown"}
                      </p>

                      <p className="mt-3 text-sm text-slate-700">
                        Document ID: {source.documentId}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-xl font-semibold">Request metrics</h2>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Metric
                  label="Embedding"
                  value={`${result.metrics.embeddingMs} ms`}
                />
                <Metric
                  label="Retrieval"
                  value={`${result.metrics.retrievalMs} ms`}
                />
                <Metric
                  label="Generation"
                  value={`${result.metrics.generationMs} ms`}
                />
                <Metric label="Total" value={`${result.metrics.totalMs} ms`} />
                <Metric
                  label="Prompt tokens"
                  value={result.metrics.promptTokens ?? "N/A"}
                />
                <Metric
                  label="Completion tokens"
                  value={result.metrics.completionTokens ?? "N/A"}
                />
              </div>

              <p className="mt-4 text-xs text-slate-500">
                Estimated API cost:{" "}
                {result.metrics.estimatedCostUsd == null
                  ? "Not configured"
                  : `$${result.metrics.estimatedCostUsd.toFixed(6)}`}
              </p>
            </div>
          </section>
        )}

        <footer className="pb-4 text-center text-xs text-slate-500">
          Baseline RAG · Workspace-wide vector retrieval · PostgreSQL + pgvector
        </footer>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words text-lg font-semibold">{value}</p>
    </div>
  );
}
