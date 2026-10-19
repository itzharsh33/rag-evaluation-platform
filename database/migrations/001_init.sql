
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO workspaces (id, name)
VALUES ('default', 'Default Workspace')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id),
    collection TEXT NOT NULL
        CHECK (collection IN ('benchmark', 'workspace')),
    filename TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    content_hash TEXT,
    page_count INTEGER NOT NULL DEFAULT 0,
    chunk_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    chunking_strategy TEXT NOT NULL DEFAULT 'fixed',
    chunk_size INTEGER NOT NULL DEFAULT 800,
    corpus_version TEXT NOT NULL DEFAULT 'v1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_scope
    ON documents (collection, workspace_id);

CREATE TABLE IF NOT EXISTS chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL
        REFERENCES documents(id) ON DELETE CASCADE,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id),
    collection TEXT NOT NULL
        CHECK (collection IN ('benchmark', 'workspace')),
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    page_number INTEGER,
    content_hash TEXT,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_chunks_scope
    ON chunks (collection, workspace_id);

CREATE TABLE IF NOT EXISTS benchmark_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_version TEXT NOT NULL UNIQUE,
    corpus_version TEXT NOT NULL,
    question_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS benchmark_questions (
    id TEXT PRIMARY KEY,
    dataset_version TEXT NOT NULL
        REFERENCES benchmark_datasets(dataset_version),
    question TEXT NOT NULL,
    ground_truth_answer TEXT NOT NULL,
    relevant_document_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    evidence_snippet TEXT NOT NULL,
    expected_facts JSONB NOT NULL DEFAULT '[]'::jsonb,
    category TEXT NOT NULL,
    is_holdout BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_questions_version
    ON benchmark_questions (dataset_version);

CREATE TABLE IF NOT EXISTS experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_version TEXT NOT NULL,
    corpus_version TEXT NOT NULL,
    strategy TEXT NOT NULL,
    config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    generation_model TEXT NOT NULL,
    judge_model TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    progress INTEGER NOT NULL DEFAULT 0
        CHECK (progress BETWEEN 0 AND 100),
    error_message TEXT,
    estimated_cost NUMERIC(12, 6),
    actual_cost NUMERIC(12, 6),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS experiment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL
        REFERENCES experiments(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL
        REFERENCES benchmark_questions(id),
    retrieved_chunks_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    generated_answer TEXT,
    expected_answer TEXT,
    retrieval_metrics_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    correctness_score NUMERIC(5, 4),
    faithfulness_score NUMERIC(5, 4),
    relevancy_score NUMERIC(5, 4),
    latency_ms NUMERIC(12, 3),
    token_usage_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    estimated_cost NUMERIC(12, 6),
    failure_type TEXT,
    correct_answer_wrong_evidence BOOLEAN NOT NULL DEFAULT FALSE,
    judge_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (experiment_id, question_id)
);

CREATE TABLE IF NOT EXISTS metric_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL
        REFERENCES experiments(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC(12, 6) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL UNIQUE
        REFERENCES experiments(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'queued',
    progress INTEGER NOT NULL DEFAULT 0
        CHECK (progress BETWEEN 0 AND 100),
    last_question_id TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
