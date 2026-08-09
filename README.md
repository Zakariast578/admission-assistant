# 🎓 Somali National University (SNU) Admission Assistant

An AI-powered Retrieval-Augmented Generation (RAG) platform designed to answer prospective student queries regarding Somali National University (SNU) admissions, faculties, programs, tuition fees, and campus locations.

The repository is structured as a full-stack monorepo featuring a FastAPI + LlamaIndex backend and a modern React + TypeScript + Vite frontend interface.

## 🏗️ Project Architecture & File Structure

```text
admission-assistant/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/          # FastAPI route handlers (/chat, /health)
│   │   │   └── dependencies.py  # Dependency injection & state management
│   │   ├── core/
│   │   │   ├── config.py        # Environment variables & Pydantic settings
│   │   │   └── logging_config.py# Centralized system logger
│   │   ├── models/
│   │   │   ├── metadata_store.py# Document metadata handling
│   │   │   └── schemas.py       # Pydantic request/response validation
│   │   ├── rag/
│   │   │   ├── ingestion/       # Loaders, custom chunker, embedder, index builder
│   │   │   │   ├── build_index.py
│   │   │   │   ├── chunker.py
│   │   │   │   ├── embedder.py
│   │   │   │   └── loaders.py
│   │   │   ├── prompts/         # Custom system prompts for admissions logic
│   │   │   └── retrieval/       # LlamaIndex query engine & reranker modules
│   │   │       ├── query_engine.py
│   │   │       └── reranker.py
│   │   ├── utils/              # Helper utilities and validators
│   │   └── main.py              # FastAPI application initialization
│   ├── data/
│   │   ├── processed/           # Parsed/chunked knowledge base files
│   │   └── raw_documents/       # Raw university markdown/PDF catalogs
│   ├── scripts/
│   │   └── ingest_docs.py       # Standalone document ingestion pipeline runner
│   ├── tests/                   # Backend test suites
│   ├── Dockerfile               # Backend containerization spec
│   ├── requirements.txt         # Python dependencies
│   └── .env                     # Environment variables
│
├── frontend/
│   ├── public/                  # Static web assets
│   ├── src/
│   │   ├── components/          # React components (ChatInput, ChatMessage, Header)
│   │   ├── services/            # API client service layer
│   │   ├── theme/               # Application UI styling configuration
│   │   ├── types/               # TypeScript interfaces
│   │   ├── App.tsx              # Root React container
│   │   └── main.tsx             # DOM entrypoint
│   ├── package.json             # Frontend node package dependencies
│   └── vite.config.ts           # Vite bundler configuration
│
└── docs/                        # Architecture diagrams and design docs
```

## ⚡ Tech Stack

### Backend

- Framework: FastAPI (Python 3.11+)
- RAG & Orchestration: LlamaIndex
- LLM: Google Gemini 3.6 Flash (`gemini-3.6-flash`)
- Vector Store & Embeddings: FAISS / BAAI/bge-small-en-v1.5 HuggingFace Embeddings
- Containerization: Docker

### Frontend

- Framework: React 18+ with TypeScript
- Build Tool: Vite
- Styling: CSS3 / Custom Component Modules

## 🚀 Quick Start Guide

### 1. Prerequisites

- Python 3.11+
- Node.js (v18+) & npm
- Google Gemini API Key

### 2. Backend Setup

Navigate to the backend directory and activate the virtual environment:

```bash
cd backend
python -m venv .venv

# Git Bash / Windows
source .venv/Scripts/activate

# Linux / macOS
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure environment variables. Create a `.env` file inside `backend/`:

```env
PROJECT_NAME="SNU Admission Assistant API"
API_V1_STR="/api/v1"
LLM_PROVIDER="gemini"
GENERATIVE_MODEL="gemini-3.6-flash"
GOOGLE_API_KEY="your_gemini_api_key_here"
FAISS_INDEX_PATH="storage"
```

Ingest documents and build the FAISS vector index:

```bash
python scripts/ingest_docs.py
```

Start the FastAPI server:

```bash
uvicorn app.main:app --reload --port 8000
```

- API docs (Swagger): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health check: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

### 3. Frontend Setup

Navigate to the frontend directory:

```bash
cd ../frontend
```

Install Node modules:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

The application will launch at [http://localhost:5173](http://localhost:5173).