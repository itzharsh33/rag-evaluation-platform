# 🚀 RAG Evaluation & Optimization Platform

**Compare retrieval strategies. Evaluate answer quality. Optimize RAG performance.**

A full-stack Retrieval-Augmented Generation (RAG) application that lets users upload documents, ask questions, compare four retrieval strategies, and evaluate performance using a benchmark dataset.

Built to explore practical RAG engineering, retrieval optimization, and systematic evaluation of LLM-powered applications.


## 🌐 Live Demo

**Live application:** http://15.252.239.113

The application is deployed on an AWS EC2 instance using Docker Compose. The public entry point is Nginx, which routes requests to the Next.js frontend and Express API. PostgreSQL with pgvector stores document chunks and evaluation data.

> **Note:** This demo currently uses HTTP. Do not enter sensitive information. HTTPS can be configured by adding a domain and TLS certificate.


## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| 🎨 Frontend | Next.js, React, TypeScript |
| ⚙️ Backend | Node.js, Express.js, TypeScript |
| 🗄️ Database | PostgreSQL, pgvector |
| 🤖 AI | OpenAI Embeddings API, OpenAI Generation API |
| 📊 Evaluation | Custom benchmark pipeline, LLM-based judging |
| 🐳 Infrastructure | Docker, Docker Compose |

## ✨ Features

- 📄 **Document ingestion:** Upload PDF and DOCX files and extract their text.
- ✂️ **Multiple chunking methods:** Fixed-size chunking and semantic-oriented chunking.
- 🧠 **Vector embeddings:** Generate embeddings using OpenAI.
- 🔍 **Four retrieval strategies:** Compare fixed vector search, semantic vector search, hybrid search, and vector re-ranking.
- 💬 **Grounded answers:** Generate answers from retrieved document context.
- 📚 **Source references:** Inspect retrieved chunks and their document metadata.
- 🛑 **Abstention:** Avoid normal answer generation when no usable retrieval context is available.
- 🧪 **Benchmark evaluation:** Evaluate strategies against development and holdout questions.
- 📈 **Performance metrics:** Measure Recall@5, MRR, answer quality, latency, and failures.
- 🗃️ **Experiment history:** Store and inspect historical experiment results.
- 🐳 **Docker support:** Run the frontend, backend, and database with Docker Compose.

## 🔎 Retrieval Strategies

The application supports four selectable retrieval strategies.

### 1. Fixed Vector Search

`fixed_vector`

- Splits documents into fixed-size overlapping chunks.
- Generates embeddings and retrieves chunks by vector similarity.
- Serves as the baseline for comparison.

### 2. Semantic Vector Search

`semantic_vector`

- Creates chunks using paragraph and sentence boundaries.
- Embeds the resulting chunks and retrieves them using vector similarity.
- Aims to preserve more natural text boundaries.

*Implementation note: The current chunker uses boundary-based heuristics rather than an LLM-based semantic segmentation model.*

### 3. Hybrid Search — Reciprocal Rank Fusion

`hybrid_rrf`

- Combines vector-based retrieval with keyword search.
- Uses Reciprocal Rank Fusion (RRF) to combine rankings.
- Balances semantic matching with exact-term matching.

The current implementation uses fixed chunks for both retrieval paths.

### 4. Vector Search + Re-ranking

`vector_rerank`

- Retrieves candidate chunks using vector similarity.
- Re-ranks candidates using vector similarity and lexical overlap.
- Selects context from the re-ranked candidates.

The current implementation uses a heuristic blend of approximately 70% vector similarity and 30% lexical overlap, rather than a trained cross-encoder.

### Strategy Overview

| Strategy | Retrieval approach | Main objective |
|---|---|---|
| Fixed Vector | Vector similarity | Establish a baseline |
| Semantic Vector | Boundary-based chunking + vector search | Preserve natural text boundaries |
| Hybrid RRF | Vector + keyword search | Combine semantic and exact-term matching |
| Vector Re-ranking | Vector candidates + lexical re-ranking | Refine candidate ordering |

## 📊 Evaluation Framework

The evaluation dashboard compares all four strategies using a fixed benchmark dataset.

### 🧪 Dataset

| Property | Value |
|---|---|
| Total questions | 50 |
| Development set | 40 questions |
| Holdout set | 10 questions |
| Dataset version | `postgresql-v1` |
| Corpus version | `workspace-v1` |

### 📏 Evaluation Metrics

| Metric | Purpose |
|---|---|
| Recall@5 | Measures whether relevant chunks appear in the top five results |
| MRR | Measures the ranking position of the first relevant result |
| Expected Fact Coverage | Estimates coverage of expected facts using the configured matching heuristic |
| Correctness | Evaluates answer correctness |
| Faithfulness | Evaluates whether answers are supported by retrieved context |
| Relevancy | Evaluates whether answers address the question |
| Average Latency | Measures average processing time in milliseconds |
| Failure Count | Counts failed questions or operations recorded by the benchmark |

The answer-quality metrics use the configured evaluation pipeline. Expected fact coverage is a heuristic, not a definitive measure of factual completeness.

## 🏆 Benchmark Results

The following tables contain the previously recorded development results and your latest holdout results.

### Development Set

| Metric | Fixed Vector | Semantic Vector | Hybrid RRF | Vector Re-ranking |
|---|---:|---:|---:|---:|
| Questions | 40 | 40 | 40 | 40 |
| Recall@5 | 0.8250 | 0.7750 | 0.8000 | **0.8375** |
| MRR | 0.8279 | **0.9042** | 0.7746 | 0.8113 |
| Expected Fact Coverage | **0.9833** | 0.9771 | **0.9833** | 0.9625 |
| Correctness | 1.0000 | 0.9975 | 0.9975 | 0.9925 |
| Faithfulness | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| Relevancy | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| Average Latency (ms) | 2539.1 | **2253.9** | 2311.7 | 2302.4 |
| Failures | **0** | 1 | 1 | 2 |

### Holdout Set — Latest Results

| Metric | Fixed Vector | Semantic Vector | Hybrid RRF | Vector Re-ranking |
|---|---:|---:|---:|---:|
| Questions | 10 | 10 | 10 | 10 |
| Recall@5 | **0.8500** | 0.7500 | **0.8500** | 0.7500 |
| MRR | 0.7083 | **0.8500** | 0.6333 | 0.6950 |
| Expected Fact Coverage | 1.0000 | 0.9500 | 1.0000 | 1.0000 |
| Correctness | 1.0000 | 0.9750 | 1.0000 | 1.0000 |
| Faithfulness | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| Relevancy | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| Average Latency (ms) | **2436.7** | 2533.1 | 2448.9 | 2656.7 |
| Failures | **0** | 1 | **0** | **0** |

*The development results are from an earlier recorded run; the holdout results are from your latest supplied benchmark run.*

### 🔍 Key Findings

- **Best Recall@5:** Fixed Vector and Hybrid RRF tied at 0.85 on the holdout set.
- **Best MRR:** Semantic Vector achieved 0.85, indicating stronger ranking of the first relevant result in this run.
- **Lowest holdout latency:** Fixed Vector recorded 2436.7 ms on average.
- **Answer correctness:** Fixed Vector, Hybrid RRF, and Vector Re-ranking recorded 1.0 correctness in the latest holdout results.
- **Reliability:** Semantic Vector recorded one failure; the other strategies recorded none.

These findings are specific to the current corpus, dataset, and implementation. With only 10 holdout questions, they should be treated as project-level experimental results rather than universal performance guarantees.

## ⚡ Single-Question Retrieval Comparison

All four strategies were also tested against the same question to compare their answers, retrieval behavior, and latency.

### ❓ Test Question

> How to create a policy on the account relation to allow only members of the managers role to access rows, and only rows of their accounts?

### ⏱️ Performance Comparison

| Metric | Fixed Vector | Semantic Vector | Hybrid RRF | Vector Re-ranking |
|---|---:|---:|---:|---:|
| Embedding (ms) | 3098 | 1442 | 367 | 407 |
| Retrieval (ms) | 89 | 47 | 77 | **11** |
| Generation (ms) | 3335 | 3440 | 3457 | **2893** |
| **Total (ms)** | 6522 | 4929 | 3901 | **3311** |
| Prompt Tokens | 1292 | 1375 | 1292 | 1296 |
| Completion Tokens | 180 | 173 | 180 | 173 |
| Sources Reported | 5 | 5 | 5 | 5 |

*These are individual request measurements, not averages. Token counts are reported by the application.*

### 💡 Answer Comparison

All four strategies generated substantially the same answer. The generated response proposed these steps:

1. Create the `accounts` table.
2. Enable row-level security.
3. Create a policy for the `managers` role that restricts rows using `manager = current_user`.

The policy shown in the generated answer was:

```sql
CREATE POLICY account_managers
ON accounts
TO managers
USING (manager = current_user);
```

This SQL is included as an example of the application's generated response, not as an independent security audit.

### 📌 Observations

- **Fastest overall:** Vector Re-ranking, with a total reported time of 3311 ms.
- **Fastest retrieval:** Vector Re-ranking, at 11 ms.
- **Second-fastest overall:** Hybrid RRF, at 3901 ms.
- **Slowest overall:** Fixed Vector, at 6522 ms.
- **Answer consistency:** All four strategies produced substantially the same answer for this question.

This is a single-question experiment. Embedding and generation latency can vary with network conditions, API overhead, and service load, so the observed time differences cannot be attributed to retrieval strategy alone. Repeated tests across multiple questions are needed for a more reliable comparison.

## 🗂️ Project Structure

A simplified view of the repository, showing the main application, evaluation, and database files:

```text
rag-evaluation-platform/
├── .github/
├── apps/
│   ├── api/
│   │   ├── evaluation-results/
│   │   │   ├── development-results.json
│   │   │   └── holdout-results.json
│   │   ├── scripts/
│   │   │   ├── import-benchmark.ts
│   │   │   └── run-benchmark.ts
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── db/
│   │   │   ├── routes/
│   │   │   │   ├── documents.ts
│   │   │   │   ├── evaluation.ts
│   │   │   │   ├── health.ts
│   │   │   │   └── rag.ts
│   │   │   ├── services/
│   │   │   │   ├── evaluation/
│   │   │   │   │   ├── judge.ts
│   │   │   │   │   ├── metrics.ts
│   │   │   │   │   └── persistence.ts
│   │   │   │   ├── retrieval/
│   │   │   │   │   ├── index.ts
│   │   │   │   │   └── types.ts
│   │   │   │   ├── chunker.ts
│   │   │   │   ├── document-extractor.ts
│   │   │   │   ├── embeddings.ts
│   │   │   │   ├── openai.ts
│   │   │   │   └── semantic-chunker.ts
│   │   │   ├── app.ts
│   │   │   └── server.ts
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── web/
│       ├── public/
│       ├── src/app/
│       │   ├── evaluation/
│       │   │   └── page.tsx
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── Dockerfile
│       └── package.json
├── data/
├── database/
│   └── migrations/
│       ├── 001_init.sql
│       └── 002_retrieval_strategies.sql
├── docs/
├── infra/
├── packages/
├── scripts/
├── tests/
├── uploads/
├── .env.example
├── docker-compose.yml          # Local development
├── docker-compose.aws.yml      # AWS EC2 deployment
├── nginx/
│   └── default.conf            # Nginx reverse proxy for AWS
├── package.json
├── benchmark_chunks_all.csv
├── benchmark_source_chunks.csv
├── chunk_id_mapping.csv
├── populate_relevant_semantic_chunk_ids.sql
├── postgresql_benchmark_50_resolved.json
```

Generated build directories and dependency folders, such as `dist`, `.next`, and `node_modules`, are omitted.

## ⚙️ Local Setup (For Developers)

### 📋 Prerequisites

- Node.js 22 LTS recommended
- npm
- Docker Desktop with Docker Compose
- An OpenAI API key with access to the configured models

Verify your installations:

```powershell
node --version
npm --version
docker --version
docker compose version
```

### 1️⃣ Clone the Repository

Replace the URL with your actual GitHub repository URL.

```powershell
git clone https://github.com/YOUR_USERNAME/rag-evaluation-platform.git
cd rag-evaluation-platform
```

### 2️⃣ Configure Environment Variables

Create a local environment file from the example:

```powershell
Copy-Item .env.example .env
```

Fill in the required values in `.env`. Check `.env.example`, `apps/api/src/config/env.ts`, and `docker-compose.yml` for the exact variable names and settings.

**Never commit your actual `.env` file or expose API keys.**

### 3️⃣ Install Dependencies

If the project is configured for npm workspaces:

```powershell
npm install
```

Otherwise, follow the installation instructions in the root and individual application package configurations.

### 4️⃣ Start the Application

From the repository root:

```powershell
docker compose up --build -d
```

Check the running services:

```powershell
docker compose ps
```

View service logs when troubleshooting:

```powershell
docker compose logs --tail=100 api
docker compose logs --tail=100 web
docker compose logs --tail=100 db
```

### 5️⃣ Open the Application

| Service | Local URL |
|---|---|
| 🏠 Main RAG application | http://localhost:3000 |
| 📊 Evaluation dashboard | http://localhost:3000/evaluation |
| ⚙️ Backend API | http://localhost:4000 |
| 🗄️ PostgreSQL host port | `5433` |

These addresses assume the default port mappings. Inside Docker, the API should connect to PostgreSQL using the Compose service name and the database's container port.

### 6️⃣ Run the Holdout Benchmark

```powershell
npm --prefix apps/api run benchmark:run -- holdout
```

The benchmark output is saved to:

```text
apps/api/evaluation-results/holdout-results.json
```

Experiment records and per-question results are also persisted in PostgreSQL.

### 7️⃣ Stop the Application

```powershell
docker compose down
```

This stops the services without intentionally deleting the database volume. Avoid removing volumes unless you intend to delete the persisted data.

## ☁️ AWS Deployment

The repository has separate Docker Compose configurations for local development and AWS deployment:

- `docker-compose.yml` — local development on your machine.
- `docker-compose.aws.yml` — deployment configuration used on the AWS EC2 instance.
- `nginx/default.conf` — Nginx reverse-proxy configuration. Public HTTP traffic enters through port `80`; the API and database are not intended to be exposed directly to the public internet.

### AWS architecture

```text
Browser
   |
   | HTTP :80
   v
Nginx
   |--------------------|
   v                    v
Next.js web         Express API
                         |
                         v
                 PostgreSQL + pgvector
```

### Updating the AWS deployment

After connecting to the EC2 instance and entering the project directory, pull the intended Git branch and rebuild/restart the services using the AWS Compose file:

```bash
git pull
docker compose -f docker-compose.aws.yml up -d --build
docker compose -f docker-compose.aws.yml ps
```

Check service logs when troubleshooting:

```bash
docker compose -f docker-compose.aws.yml logs --tail=100 api
docker compose -f docker-compose.aws.yml logs --tail=100 web
docker compose -f docker-compose.aws.yml logs --tail=100 nginx
```

Before running deployment commands, ensure the required environment file and variables exist on the EC2 instance. Keep production secrets on the server; do not commit `.env` files, API keys, database dumps, or other credentials to Git. Back up the database before making schema or migration changes. Avoid `docker compose down -v` on the production server because removing volumes can delete persisted database data.

The public demo URL may change if the EC2 instance's public IP changes. For a stable public URL and HTTPS, configure a domain name and TLS.

## 🔐 Environment Variables

Use `.env.example` as the source of truth for required configuration.

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Authenticates OpenAI requests |
| `OPENAI_EMBEDDING_MODEL` | Selects the embedding model |
| `OPENAI_GENERATION_MODEL` | Selects the generation model |
| `OPENAI_JUDGE_MODEL` | Selects the evaluation model |
| `DATABASE_URL` | Database connection configuration |
| `PORT` | Backend server port |
| `NEXT_PUBLIC_API_BASE_URL` | API base URL used by the frontend |
| `WORKSPACE_ID` | Workspace identifier, if required by the implementation |

Previously used model configuration:

```dotenv
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_GENERATION_MODEL=gpt-4.1-mini
OPENAI_JUDGE_MODEL=gpt-4.1-mini
```

Verify these settings against your current code before using them. Never publish real credentials.

## 🔌 API Endpoints

The following table summarizes the main application workflows. Verify the exact paths and methods against the current route files.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/documents/upload` | Upload and index a document |
| `POST` | `/api/documents/:id/index-semantic` | Generate semantic-oriented chunks |
| `DELETE` | `/api/documents/:id` | Delete a document and associated chunks |
| `POST` | `/api/rag/query` | Query documents using a selected retrieval strategy |
| `GET` | `/api/evaluation/experiments` | Retrieve experiment results and history |

### Example RAG Query

```json
{
  "question": "How does PostgreSQL row-level security work?",
  "topK": 5,
  "strategy": "hybrid_rrf"
}
```

Supported strategy identifiers:

- `fixed_vector`
- `semantic_vector`
- `hybrid_rrf`
- `vector_rerank`

The backend defaults to `fixed_vector` when the strategy is omitted.

## ⚠️ Known Limitations

### 1. Heuristic Semantic Chunking

The semantic-oriented chunker uses paragraph and sentence boundaries rather than a learned semantic segmentation model.

### 2. Heuristic Re-ranking

Re-ranking uses vector similarity and lexical overlap instead of a trained cross-encoder. Its rankings may not always match human relevance judgments.

### 3. Limited Holdout Dataset

The holdout dataset contains 10 questions. A larger and more diverse dataset would provide stronger evidence for generalization.

### 4. LLM-Based Evaluation

Correctness, faithfulness, and relevancy scores can be affected by judge-model behavior and prompt design. They should be interpreted alongside retrieval metrics and manual review.

### 5. Single-Question Latency Variability

The single-question test measures individual requests, not averages. Repeated experiments under consistent conditions are needed to make reliable latency comparisons.

## 🚀 Future Improvements

- Expand the benchmark with more questions, document types, and difficulty levels.
- Validate expected fact coverage against manually reviewed examples.
- Add repeated-run latency statistics and more detailed failure analysis.
- Compare heuristic re-ranking against a dedicated cross-encoder.
- Add automated CI checks to catch retrieval and answer-quality regressions.
- Improve observability for latency, token usage, and retrieval failures.

## 👨‍💻 Author

**Your Name**  
B.Tech, Computer Science and Engineering  
Indian Institute of Information Technology, Bhagalpur

- GitHub: [YOUR_GITHUB_USERNAME](https://github.com/itzharsh33)
- LinkedIn: [YOUR_LINKEDIN_PROFILE](https://www.linkedin.com/in/harsh-kumar-yadav-20844a2b6/)

---

*Built to explore practical RAG engineering, retrieval optimization, and systematic evaluation of LLM-powered applications.*
