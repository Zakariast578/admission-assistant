import os
from llama_index.core import StorageContext, load_index_from_storage
from llama_index.core.llms import LLM
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.vector_stores.faiss import FaissVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.openrouter import OpenRouter
from llama_index.llms.google_genai import GoogleGenAI

from app.core.config import settings
from app.core.logging_config import logger


def get_llm() -> LLM:
    if settings.LLM_PROVIDER.lower() == "openrouter":
        logger.info(f"Initializing OpenRouter LLM: {settings.OPENROUTER_MODEL}")
        return OpenRouter(
            api_key=settings.OPENROUTER_API_KEY,
            model=settings.OPENROUTER_MODEL,
            max_tokens=1024,
            temperature=0.1,
        )
    else:
        logger.info(f"Initializing Google Gemini LLM: {settings.GENERATIVE_MODEL}")
        return GoogleGenAI(
            api_key=settings.GOOGLE_API_KEY,
            model=settings.GENERATIVE_MODEL,
            temperature=0.1,
        )


def get_embedding_model():
    return HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")


def load_query_engine() -> RetrieverQueryEngine | None:
    if not os.path.exists(settings.FAISS_INDEX_PATH):
        logger.warning(f"Vector store path not found at: {settings.FAISS_INDEX_PATH}")
        return None

    try:
        llm = get_llm()
        embed_model = get_embedding_model()

        # Load vector store from saved directory
        vector_store = FaissVectorStore.from_persist_dir(settings.FAISS_INDEX_PATH)
        
        # Reload full context (including raw text docstore) from directory
        storage_context = StorageContext.from_defaults(
            vector_store=vector_store,
            persist_dir=settings.FAISS_INDEX_PATH
        )

        # Reconstruct index directly from storage context
        index = load_index_from_storage(
            storage_context=storage_context,
            embed_model=embed_model
        )

        return index.as_query_engine(llm=llm, similarity_top_k=3)
    except Exception as e:
        logger.error(f"Error loading FAISS vector index: {str(e)}")
        return None