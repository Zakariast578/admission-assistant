"""Standalone document ingestion and retrieval verification script.

Examples:
    python scripts/ingest_docs.py
    python scripts/ingest_docs.py --query "What faculties are available?"
    python scripts/ingest_docs.py --source-dir data/raw_documents --source-dir documents --query "How much is the registration fee?"
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import settings
from app.core.logging_config import logger
from app.rag.ingestion.build_index import build_and_persist_index
from app.rag.retrieval.query_engine import load_query_engine


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Rebuild the FAISS index and optionally run a retrieval query.")
    parser.add_argument(
        "--source-dir",
        action="append",
        dest="source_dirs",
        default=None,
        help="Document source directory. Can be provided multiple times. Defaults to backend/data/raw_documents and backend/documents when present.",
    )
    parser.add_argument(
        "--query",
        type=str,
        default=None,
        help="Optional query to run after reindexing for a direct retrieval smoke test.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source_dirs = args.source_dirs or None

    logger.info("Starting reindex operation for FAISS store at %s", settings.FAISS_INDEX_PATH)
    build_and_persist_index(source_directories=source_dirs)

    if args.query:
        logger.info("Running retrieval smoke test for query: %s", args.query)
        query_engine = load_query_engine()
        if query_engine is None:
            logger.error("Query engine could not be initialized after indexing.")
            return 1

        response = query_engine.query(args.query)
        print("\n=== Retrieval Response ===\n")
        print(str(response))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())