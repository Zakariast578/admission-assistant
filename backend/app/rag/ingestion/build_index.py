from pathlib import Path

import faiss
from llama_index.core import Settings, StorageContext, VectorStoreIndex
from llama_index.vector_stores.faiss import FaissVectorStore

from app.core.config import settings
from app.core.logging_config import logger
from app.rag.ingestion.embedder import get_embedding_model
from app.rag.ingestion.loaders import load_documents_from_directories
from app.rag.ingestion.chunker import chunk_documents


def _default_source_directories() -> list[str]:
    backend_root = Path(__file__).resolve().parents[3]
    candidate_paths = [backend_root / settings.RAW_DOCS_PATH, backend_root / "documents"]
    return [str(path) for path in candidate_paths if path.exists()]


def build_and_persist_index(source_directories: list[str] | None = None):
    logger.info("--- Starting Vector & Document Storage Pipeline ---")

    documents = load_documents_from_directories(source_directories or _default_source_directories())
    if not documents:
        logger.error("No documents found in the configured source directories.")
        return

    nodes = chunk_documents(documents)

    # Local embedding setup (384 dimensions for BAAI/bge-small-en-v1.5)
    embedding_dimension = 384
    faiss_index = faiss.IndexFlatL2(embedding_dimension)
    vector_store = FaissVectorStore(faiss_index=faiss_index)

    # Initialize storage context with both vector_store and default docstore
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    logger.info("Initializing Local HuggingFace Embedding Engine...")
    embed_model = get_embedding_model()

    logger.info("Building Index and mapping text chunks to vector store...")
    Settings.embed_model = embed_model
    VectorStoreIndex(
        nodes,
        storage_context=storage_context,
        embed_model=embed_model
    )

    # Persist EVERYTHING (vectors + docstore + index_store)
    Path(settings.FAISS_INDEX_PATH).mkdir(parents=True, exist_ok=True)
    storage_context.persist(persist_dir=settings.FAISS_INDEX_PATH)
    logger.info(f"✅ Full Index and Document Store successfully persisted to: {settings.FAISS_INDEX_PATH}")


if __name__ == "__main__":
    build_and_persist_index()