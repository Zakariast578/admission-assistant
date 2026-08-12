# 🎓 SNU Admission Assistant

An AI-powered **Retrieval-Augmented Generation (RAG)** platform that answers prospective and current students' questions about **Somali National University (SNU)** — admissions, faculties, academic policies, programs, tuition fees, and campus locations.

The project is a full-stack monorepo:

- **Backend:** FastAPI + LlamaIndex + PostgreSQL (`pgvector`)
- **Frontend:** React + TypeScript + Vite

---

## ✨ Features

- 💬 **Conversational RAG chat** with persistent, database-backed conversation history
- 📚 **Knowledge base manager** — upload, categorize, and delete source documents (PDF, DOCX, TXT)
- 👁️ **In-app document viewer** for inline previews of indexed files
- 🧩 **Embeddable chat widget** for quick access from any page
- 🗃️ **Vector search over PostgreSQL** using the `pgvector` extension (no separate vector DB service required)
- 🌍 **Multilingual responses** — the assistant replies in whatever language the user asks in (including Somali)

---

## 🏗️ Architecture & Project Structure

```
admission-assistant/
├── docker-compose.yml            # PostgreSQL + pgvector container
├── alembic.ini                   # Database migration configuration
├── .gitignore
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/            # REST endpoints (chat, documents, health)
│   │   │   └── dependencies.py    # DB session + RAG query engine injection
│   │   ├── core/
│   │   │   ├── config.py          # Pydantic Settings & env configuration
│   │   │   ├── database.py        # Async SQLAlchemy engine/session
│   │   │   └── logging_config.py  # Application logger setup
│   │   ├── models/
│   │   │   ├── domain.py          # SQLAlchemy models (Document, Conversation, ChatMessage)
│   │   │   └── schemas.py         # Pydantic request/response schemas
│   │   ├── rag/
│   │   │   └── retrieval/
│   │   │       └── query_engine.py   # LlamaIndex + PGVector + Gemini pipeline
│   │   ├── services/
│   │   │   └── document_service.py   # Ingestion, sanitization, embedding & indexing
│   │   └── main.py                # FastAPI app entrypoint
│   ├── data/
│   │   ├── uploads/                # Uploaded document storage
│   │   └── raw_documents/          # Pre-loaded seed documents
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env                        # Environment configuration (not committed)
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/             # Home, ChatWidget, DocumentViewerModal, Header
    │   ├── services/                # API client (fetch-based)
    │   ├── types/                   # Shared TypeScript interfaces
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts
```

---

## ⚡ Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | FastAPI (Python 3.11+) |
| RAG Orchestration | LlamaIndex |
| Vector Store | PostgreSQL + `pgvector` extension (`pgvector/pgvector:pg16`) |
| ORM / Migrations | Async SQLAlchemy + AsyncPG + Alembic |
| LLM Provider | Google Gemini (`gemini-2.5-flash` or later) — Ollama fallback |
| Embedding Model | `BAAI/bge-small-en-v1.5` (384 dimensions) |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18+ with TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS, Lucide React icons |
| Markdown Rendering | `react-markdown` |
| Document Preview | `docx-preview` for Word docs, native blob URLs for PDFs |

> **Note:** `faiss-cpu` and `llama-index-vector-stores-faiss` currently appear in `requirements.txt`, but the active retrieval pipeline (`query_engine.py`) uses `PGVectorStore` against PostgreSQL, not FAISS. If FAISS isn't used elsewhere in your codebase, consider removing those dependencies to avoid confusion and reduce install size.

---

## 🛠️ API Reference

All routes are served under the `/api/v1` prefix.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/chat` | Submit a user query to the RAG pipeline; returns the generated answer and conversation ID. |
| `POST` | `/api/v1/documents/upload` | Upload a PDF, DOCX, or TXT file; extracts text, sanitizes it, and indexes embeddings in `pgvector`. |
| `GET` | `/api/v1/documents/` | List all indexed knowledge base documents. |
| `GET` | `/api/v1/documents/{document_id}/file` | Stream a document's raw file content for inline viewing or download. |
| `DELETE` | `/api/v1/documents/{document_id}` | Remove a document's metadata record (and, once wired up, its embeddings). |
| `GET` | `/api/v1/health` | Service health check. |

Interactive API docs are available once the server is running:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- A Google Gemini API key (or a local Ollama installation for the fallback provider)

### 1. Start the database

```bash
docker-compose up -d postgres
```

This spins up PostgreSQL with the `pgvector` extension pre-installed, exposed on port `5432`.

### 2. Backend setup

```bash
cd backend
python -m venv .venv

# Activate the virtual environment
source .venv/bin/activate        # Linux/macOS
source .venv/Scripts/activate    # Windows (Git Bash)
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `backend/.env` (see [Environment Variables](#-environment-variables) below), then run migrations:

```bash
alembic upgrade head
```

Start the API server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Health check: `http://127.0.0.1:8000/api/v1/health`
- Swagger docs: `http://127.0.0.1:8000/docs`

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL="http://localhost:8000/api/v1"
```

Start the dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🔐 Environment Variables

Create `backend/.env` using the template below. **Never commit real API keys, tokens, or passwords** — use `backend/.env.example` for a checked-in template and keep the real file out of version control (it's already covered by `.gitignore`).

```env
PROJECT_NAME="Admission Assistant RAG API"
ENVIRONMENT="development"
LOG_LEVEL="INFO"

HOST="0.0.0.0"
PORT=8000
CORS_ORIGINS=["http://localhost:5173"]

# LLM Provider
LLM_PROVIDER="gemini"
GOOGLE_API_KEY="your_google_gemini_api_key_here"
GENERATIVE_MODEL="gemini-2.5-flash"
EMBEDDING_MODEL="BAAI/bge-small-en-v1.5"

# Hugging Face (used by the local embedding model)
HF_TOKEN="your_hugging_face_token_here"

# Storage paths
RAW_DOCS_PATH="data/raw_documents"

# PostgreSQL
POSTGRES_USER="snu_admin"
POSTGRES_PASSWORD="your_postgres_password_here"
POSTGRES_HOST="127.0.0.1"
POSTGRES_PORT=5432
POSTGRES_DB="snu_admissions_db"
```

> ⚠️ **Security note:** the default `docker-compose.yml` and `alembic.ini` in this repo ship with a placeholder password (`snu_password_123`). Change this before deploying anywhere beyond local development, and make sure `POSTGRES_PASSWORD` matches across `docker-compose.yml`, `backend/.env`, and `alembic.ini`.

---

## 🧪 Testing

```bash
cd backend
pytest
```

---

## 🗺️ Roadmap Ideas

- Wire up embedding cleanup on document delete (currently only the metadata row is removed)
- Add authentication/authorization for the admin knowledge-base panel
- Add streaming responses to the frontend chat (the query engine already supports `streaming=True`)
- Add CI checks (lint, type-check, tests) on pull requests

---

## 📄 License

Add your license of choice here (e.g., MIT).