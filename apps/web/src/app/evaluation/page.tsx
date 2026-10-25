"use client";

import { useCallback, useEffect, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type Experiment = {
  id: string;
  dataset_version: string;
  corpus_version: string;
  strategy: string;
  status: string;
  progress: number;
  created_at: string;
  finished_at: string | null;
  metrics: Record<string, number>;
};

type EvaluationResult = {
  id?: string;
  question_id: string;
  question?: string | null;
  generated_answer: string | null;
  expected_answer: string | null;
  retrieved_chunks_json?: unknown;
  retrieval_metrics_json?: Record<string, unknown> | null;
  correctness_score: number | null;
  faithfulness_score: number | null;
  relevancy_score: number | null;
  latency_ms?: number | null;
  token_usage_json?: unknown;
  failure_type: string | null;
  correct_answer_wrong_evidence: boolean | null;
  judge_reason: string | null;
};

type Failure = EvaluationResult;

type Tab = "all" | "failures";

function score(value: number | string | null | undefined) {
  if (value == null || value === "") return "—";

  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue.toFixed(3)
    : "—";
}

function formatLatency(value: number | null | undefined) {
  return value == null ? "—" : `${Math.round(value)} ms`;
}

function formatJson(value: unknown) {
  if (value == null) return "No data available.";

  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function isFailure(result: EvaluationResult) {
  return (
    (result.failure_type != null &&
      result.failure_type !== "none") ||
    result.correct_answer_wrong_evidence === true
  );
}

function statusClasses(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-50 text-green-700";

    case "failed":
    case "error":
      return "bg-red-50 text-red-700";

    case "running":
      return "bg-blue-50 text-blue-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function EvaluationPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [failures, setFailures] = useState<Failure[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const loadExperiments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/evaluation/experiments`,
      );

      if (!response.ok) {
        throw new Error("Could not load evaluation experiments.");
      }

      const data = await response.json();
      const items: Experiment[] = data.experiments ?? [];

      setExperiments(items);

      setSelectedId((current) => {
        if (items.some((item) => item.id === current)) {
          return current;
        }

        return items[0]?.id ?? "";
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load evaluation experiments.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadResults = useCallback(async (experimentId: string) => {
    if (!experimentId) {
      setResults([]);
      setFailures([]);
      return;
    }

    setLoadingResults(true);
    setError("");
    setResults([]);
    setFailures([]);

    try {
      const [resultsResponse, failuresResponse] = await Promise.all([
        fetch(
          `${API_BASE_URL}/api/evaluation/experiments/${experimentId}/results`,
        ),
        fetch(
          `${API_BASE_URL}/api/evaluation/experiments/${experimentId}/failures`,
        ),
      ]);

      if (!resultsResponse.ok) {
        throw new Error(
          "Could not load all question results. Check that the evaluation results API endpoint is implemented.",
        );
      }

      if (!failuresResponse.ok) {
        throw new Error("Could not load failure analysis.");
      }

      const resultsData = await resultsResponse.json();
      const failuresData = await failuresResponse.json();

      setResults(resultsData.results ?? []);
      setFailures(failuresData.failures ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load evaluation results.",
      );
    } finally {
      setLoadingResults(false);
    }
  }, []);

  useEffect(() => {
    void loadExperiments();
  }, [loadExperiments]);

  useEffect(() => {
    void loadResults(selectedId);
  }, [selectedId, loadResults]);

  const selectedExperiment = experiments.find(
    (experiment) => experiment.id === selectedId,
  );

  const visibleResults = results.filter((result) => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return true;

    return (
      result.question_id.toLowerCase().includes(search) ||
      (result.question ?? "").toLowerCase().includes(search) ||
      (result.generated_answer ?? "").toLowerCase().includes(search) ||
      (result.expected_answer ?? "").toLowerCase().includes(search) ||
      (result.failure_type ?? "").toLowerCase().includes(search)
    );
  });

  const visibleFailures = failures.filter((failure) => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return true;

    return (
      failure.question_id.toLowerCase().includes(search) ||
      (failure.question ?? "").toLowerCase().includes(search) ||
      (failure.generated_answer ?? "").toLowerCase().includes(search) ||
      (failure.expected_answer ?? "").toLowerCase().includes(search) ||
      (failure.failure_type ?? "").toLowerCase().includes(search)
    );
  });

  const successfulCount = results.filter(
    (result) => !isFailure(result),
  ).length;

  const detectedFailureCount = results.filter(isFailure).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
              RAG Evaluation Platform
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Evaluation dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-slate-600">
              Compare retrieval strategies, inspect individual answers,
              and understand why your RAG system succeeds or fails.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadExperiments()}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {/* Experiment comparison */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-xl font-semibold">
              Strategy comparison
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Compare the saved results for each retrieval strategy.
            </p>
          </div>

          {loading ? (
            <p className="mt-5 text-sm text-slate-500">
              Loading experiments...
            </p>
          ) : experiments.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">
              No experiments saved yet. Run the evaluation benchmark first.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="border-b bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3 font-medium">Strategy</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Recall@5</th>
                    <th className="p-3 font-medium">MRR</th>
                    <th className="p-3 font-medium">Correctness</th>
                    <th className="p-3 font-medium">Faithfulness</th>
                    <th className="p-3 font-medium">Relevancy</th>
                    <th className="p-3 font-medium">Latency</th>
                    <th className="p-3 font-medium">Inspect</th>
                  </tr>
                </thead>

                <tbody>
                  {experiments.map((experiment) => {
                    const isSelected = selectedId === experiment.id;

                    return (
                      <tr
                        key={experiment.id}
                        className={`border-b last:border-0 ${
                          isSelected ? "bg-blue-50/50" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="p-3 font-medium">
                          {experiment.strategy}
                          <p className="mt-1 text-xs font-normal text-slate-500">
                            {experiment.dataset_version}
                          </p>
                        </td>

                        <td className="p-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(
                              experiment.status,
                            )}`}
                          >
                            {experiment.status}
                          </span>
                        </td>

                        <td className="p-3">
                          {score(experiment.metrics?.recall_at_5)}
                        </td>

                        <td className="p-3">
                          {score(experiment.metrics?.mrr)}
                        </td>

                        <td className="p-3">
                          {score(experiment.metrics?.correctness)}
                        </td>

                        <td className="p-3">
                          {score(experiment.metrics?.faithfulness)}
                        </td>

                        <td className="p-3">
                          {score(experiment.metrics?.relevancy)}
                        </td>

                        <td className="p-3">
                          {formatLatency(experiment.metrics?.latency_ms)}
                        </td>

                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedId(experiment.id);
                              setSearchTerm("");
                              setActiveTab("all");
                            }}
                            className="whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium transition hover:bg-slate-100"
                          >
                            View questions
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Selected experiment */}
        {selectedExperiment && (
          <section className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">
                  Question-level evaluation
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Inspect individual answers for the selected experiment.
                </p>
              </div>

              <label className="w-full sm:w-auto">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Selected experiment
                </span>

                <select
                  value={selectedId}
                  onChange={(event) => {
                    setSelectedId(event.target.value);
                    setSearchTerm("");
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm sm:min-w-[280px]"
                >
                  {experiments.map((experiment) => (
                    <option key={experiment.id} value={experiment.id}>
                      {experiment.strategy} — {experiment.dataset_version} —{" "}
                      {experiment.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                label="Questions with saved results"
                value={results.length}
                description="All persisted question evaluations"
              />

              <SummaryCard
                label="Successful evaluations"
                value={successfulCount}
                description="No classified failure recorded"
              />

              <SummaryCard
                label="Detected failures"
                value={detectedFailureCount}
                description="Includes inadequate evidence flags"
              />

              <SummaryCard
                label="Experiment status"
                value={selectedExperiment.status}
                description={`${selectedExperiment.progress ?? 0}% progress`}
              />
            </div>

            {/* Tabs and search */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div
                  role="tablist"
                  aria-label="Question results views"
                  className="flex flex-wrap gap-2"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "all"}
                    onClick={() => {
                      setActiveTab("all");
                      setSearchTerm("");
                    }}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      activeTab === "all"
                        ? "bg-blue-700 text-white"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    All Questions ({results.length})
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "failures"}
                    onClick={() => {
                      setActiveTab("failures");
                      setSearchTerm("");
                    }}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      activeTab === "failures"
                        ? "bg-blue-700 text-white"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Failure Analysis ({failures.length})
                  </button>
                </div>

                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search question or answer..."
                  aria-label="Search question results"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-xs"
                />
              </div>

              {loadingResults ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Loading question evaluations...
                </div>
              ) : activeTab === "all" ? (
                <div className="space-y-4 p-4 sm:p-5">
                  {visibleResults.length === 0 ? (
                    <EmptyState
                      title={
                        results.length === 0
                          ? "No question results found"
                          : "No matching questions"
                      }
                      description={
                        results.length === 0
                          ? "This experiment has no saved question-level results. Check whether the evaluation run completed and persisted its results."
                          : "Try a different search term."
                      }
                    />
                  ) : (
                    <>
                      <p className="text-xs text-slate-500">
                        Showing {visibleResults.length} of {results.length}{" "}
                        saved results.
                      </p>

                      {visibleResults.map((result, index) => (
                        <ResultCard
                          key={
                            result.id ??
                            `${result.question_id}-${index}`
                          }
                          result={result}
                        />
                      ))}
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4 p-4 sm:p-5">
                  {visibleFailures.length === 0 ? (
                    <EmptyState
                      title={
                        failures.length === 0
                          ? "No detected failures"
                          : "No matching failures"
                      }
                      description={
                        failures.length === 0
                          ? "No failure records were returned for this experiment. Check All Questions to inspect the complete evaluation results."
                          : "Try a different search term."
                      }
                    />
                  ) : (
                    <>
                      <p className="text-xs text-slate-500">
                        Showing {visibleFailures.length} of {failures.length}{" "}
                        detected failures.
                      </p>

                      {visibleFailures.map((failure, index) => (
                        <ResultCard
                          key={
                            failure.id ??
                            `${failure.question_id}-${index}`
                          }
                          result={failure}
                        />
                      ))}
                    </>
                  )}
                </div>
              )}
            </section>
          </section>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-2 break-words text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 px-5 py-10 text-center">
      <h3 className="font-semibold text-slate-800">{title}</h3>

      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

function ResultCard({ result }: { result: EvaluationResult }) {
  const [showEvidence, setShowEvidence] = useState(false);
  const failed = isFailure(result);

  return (
    <article className="rounded-xl border border-slate-200 p-4 sm:p-5">
      {/* Question heading */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">
            Question {result.question_id}
          </h3>

          {result.question && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {result.question}
            </p>
          )}
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            failed
              ? "bg-amber-50 text-amber-800"
              : "bg-green-50 text-green-700"
          }`}
        >
          {failed
            ? result.failure_type ?? "Detected failure"
            : "No classified failure"}
        </span>
      </div>

      {/* Scores */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ScoreCard
          label="Correctness"
          value={result.correctness_score}
        />

        <ScoreCard
          label="Faithfulness"
          value={result.faithfulness_score}
        />

        <ScoreCard
          label="Relevancy"
          value={result.relevancy_score}
        />

        <ScoreCard
          label="Latency"
          value={
            result.latency_ms == null
              ? "—"
              : `${Math.round(result.latency_ms)} ms`
          }
        />
      </div>

      {result.correct_answer_wrong_evidence && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          The answer may be correct, but its supporting evidence is
          inadequate.
        </p>
      )}

      {/* Answers */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <AnswerPanel
          title="Generated answer"
          content={result.generated_answer}
        />

        <AnswerPanel
          title="Reference answer"
          content={result.expected_answer}
        />
      </div>

      {/* Judge explanation */}
      <div className="mt-4 rounded-lg bg-slate-50 p-4">
        <h4 className="text-sm font-semibold text-slate-800">
          Judge explanation
        </h4>

        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {result.judge_reason ?? "No judge explanation available."}
        </p>
      </div>

      {/* Retrieved evidence */}
      <div className="mt-4">
        <button
          type="button"
          aria-expanded={showEvidence}
          onClick={() => setShowEvidence((current) => !current)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {showEvidence ? "Hide retrieval details" : "Show retrieval details"}
        </button>

        {showEvidence && (
          <div className="mt-3 space-y-4">
            <div>
              <h4 className="mb-2 text-sm font-semibold">
                Retrieved chunks
              </h4>

              <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {formatJson(result.retrieved_chunks_json)}
              </pre>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold">
                Retrieval metrics
              </h4>

              <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {formatJson(result.retrieval_metrics_json)}
              </pre>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold">
                Token usage
              </h4>

              <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {formatJson(result.token_usage_json)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function ScoreCard({
  label,
  value,
}: {
  label: string;
  value: number | string | null | undefined;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>

      <p className="mt-1 break-words text-base font-semibold text-slate-900">
        {typeof value === "number" ? score(value) : value ?? "—"}
      </p>
    </div>
  );
}

function AnswerPanel({
  title,
  content,
}: {
  title: string;
  content: string | null;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>

      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
        {content || "No answer available."}
      </p>
    </div>
  );
}