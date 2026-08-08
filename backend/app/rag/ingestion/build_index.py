import os
import sys
from pathlib import Path

# Ensure root directory is on the Python path
sys.path.append(str(Path(__file__).resolve().parents[3]))

import faiss
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.core.storage.docstore import SimpleDocumentStore
from llama_index.core.storage.index_store import SimpleIndexStore
from llama_index.vector_stores.faiss import FaissVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

from app.core.config import settings
from app.core.logging_config import logger
from app.rag.ingestion.loaders import load_documents_from_directory
from app.rag.ingestion.chunker import chunk_documents


def build_and_persist_index():
    logger.info("--- Starting Vector & Document Storage Pipeline ---")

    documents = load_documents_from_directory(settings.RAW_DOCS_PATH)
    if not documents:
        logger.error(f"No documents found in '{settings.RAW_DOCS_PATH}'. Add PDF/DOCX files before indexing.")
        return

    nodes = chunk_documents(documents)

    # BAAI/bge-small-en-v1.5 embedding dimension is 384
    embedding_dimension = 384
    faiss_index = faiss.IndexFlatL2(embedding_dimension)
    vector_store = FaissVectorStore(faiss_index=faiss_index)

    # Initialize a complete storage context with vector, doc, and index stores
    storage_context = StorageContext.from_defaults(
        vector_store=vector_store,
        docstore=SimpleDocumentStore(),
        index_store=SimpleIndexStore()
    )

    logger.info("Initializing Local HuggingFace Embedding Engine...")
    embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")

    logger.info("Building Index and mapping text chunks to vector store...")
    index = VectorStoreIndex(
        nodes,
        storage_context=storage_context,
        embed_model=embed_model
    )

    os.makedirs(settings.FAISS_INDEX_PATH, exist_ok=True)
    # Persists vector_store, docstore.json, and index_store.json together
    storage_context.persist(persist_dir=settings.FAISS_INDEX_PATH)
    logger.info(f"✅ Full Index and Document Store successfully persisted to: {settings.FAISS_INDEX_PATH}")


if __name__ == "__main__":
    build_and_persist_index()