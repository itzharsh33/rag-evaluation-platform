
# Project Progress

## Current day
Day 1 — Foundation

## Completed
- [ ] Repository structure
- [ ] Next.js frontend
- [ ] Express + TypeScript API
- [ ] Docker Compose
- [ ] PostgreSQL + pgvector
- [ ] Database schema
- [ ] Frontend-to-API health check
- [ ] AWS account and billing setup
- [ ] GitHub repository
- [ ] Benchmark topic selected

## Installed packages
- Frontend: see apps/web/package.json
- Backend: see apps/api/package.json

## Environment variable names
DATABASE_URL
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
OPENAI_API_KEY
OPENAI_EMBEDDING_MODEL
OPENAI_GENERATION_MODEL
OPENAI_JUDGE_MODEL
NEXT_PUBLIC_API_BASE_URL
WORKSPACE_ID

No real secrets belong in this file.

## Database tables
workspaces
documents
chunks
benchmark_datasets
benchmark_questions
experiments
experiment_results
metric_history
evaluation_jobs

## API endpoints
GET /api
GET /api/health

## Known issues
Record exact errors and current status here.

## AWS resources
Record only resources actually created and verified.
Do not record planned resources as completed.

## Next day
Day 2 — Document ingestion and baseline RAG:
PDF/DOCX extraction, chunking, embeddings, vector search,
answer generation, citations, Documents page, Ask page.
