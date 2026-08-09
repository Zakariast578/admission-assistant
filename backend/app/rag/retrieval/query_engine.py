import os
from typing import Any

from llama_index.core import PromptTemplate, Settings, StorageContext, load_index_from_storage
from llama_index.core.llms import LLM
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.llms.openrouter import OpenRouter
from llama_index.vector_stores.faiss import FaissVectorStore

from app.core.config import settings
from app.core.logging_config import logger
from app.rag.ingestion.embedder import get_embedding_model as get_shared_embedding_model
from app.rag.prompts.system_prompt import ADMISSION_ASSISTANT_SYSTEM_PROMPT

QA_PROMPT_TMPL = ADMISSION_ASSISTANT_SYSTEM_PROMPT

qa_prompt = PromptTemplate(QA_PROMPT_TMPL)


def get_llm() -> LLM:
    if settings.LLM_PROVIDER.lower() == "gemini":
        logger.info(f"Initializing Gemini LLM: {settings.GENERATIVE_MODEL}")
        return GoogleGenAI(
            api_key=settings.GOOGLE_API_KEY,
            model=settings.GENERATIVE_MODEL,
            temperature=0.1,
        )
    else:
        logger.info(f"Initializing OpenRouter LLM: {settings.OPENROUTER_MODEL}")
        return OpenRouter(
            api_key=settings.OPENROUTER_API_KEY,
            model=settings.OPENROUTER_MODEL,
            max_tokens=1024,
            temperature=0.1,
        )


def get_embedding_model():
    # BGE models require query_instruction for optimal retrieval accuracy.
    return get_shared_embedding_model(with_query_instruction=True)


class DebugQueryEngine:
    def __init__(self, query_engine: Any, retriever: Any):
        self._query_engine = query_engine
        self._retriever = retriever

    def _log_retrieved_nodes(self, query: str) -> None:
        nodes = self._retriever.retrieve(query)
        logger.info(f"Retrieved {len(nodes)} context nodes for query: {query}")

        for rank, node_with_score in enumerate(nodes, start=1):
            node = getattr(node_with_score, "node", None)
            score = getattr(node_with_score, "score", None)
            metadata = getattr(node, "metadata", {}) if node is not None else {}

            content = ""
            if node is not None:
                content = getattr(node, "text", "") or ""
                if not content and hasattr(node, "get_content"):
                    try:
                        content = node.get_content()
                    except TypeError:
                        content = node.get_content(metadata_mode="none")

            preview = " ".join(content.split())[:350]
            logger.info(
                "Retrieved node %s | score=%s | source=%s | page=%s | preview=%s",
                rank,
                f"{score:.4f}" if isinstance(score, (float, int)) else "n/a",
                metadata.get("file_name") or metadata.get("file_path") or "unknown",
                metadata.get("page_number", "n/a"),
                preview,
            )

    def query(self, query: str):
        self._log_retrieved_nodes(query)
        return self._query_engine.query(query)

    async def aquery(self, query: str):
        self._log_retrieved_nodes(query)
        return await self._query_engine.aquery(query)


def load_query_engine() -> Any | None:
    if not os.path.exists(settings.FAISS_INDEX_PATH):
        logger.warning(f"Vector store path not found at: {settings.FAISS_INDEX_PATH}")
        return None

    try:
        llm = get_llm()
        embed_model = get_embedding_model()

        # Set globally in LlamaIndex Settings
        Settings.llm = llm
        Settings.embed_model = embed_model

        vector_store = FaissVectorStore.from_persist_dir(settings.FAISS_INDEX_PATH)
        storage_context = StorageContext.from_defaults(
            vector_store=vector_store,
            persist_dir=settings.FAISS_INDEX_PATH
        )

        index = load_index_from_storage(
            storage_context=storage_context,
            embed_model=embed_model
        )

        retriever = index.as_retriever(similarity_top_k=6)
        query_engine = index.as_query_engine(
            llm=llm,
            embed_model=embed_model,
            similarity_top_k=6,
            text_qa_template=qa_prompt
        )
        return DebugQueryEngine(query_engine=query_engine, retriever=retriever)
    except (OSError, RuntimeError, ValueError, TypeError) as exc:
        logger.error(f"Error loading FAISS vector index: {exc!r}")
        return None