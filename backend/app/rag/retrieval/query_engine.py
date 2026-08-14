# app/rag/retrieval/query_engine.py

from llama_index.core import VectorStoreIndex, Settings, PromptTemplate
from llama_index.core.node_parser import SentenceSplitter
from llama_index.vector_stores.postgres import PGVectorStore
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.llms.ollama import Ollama

from app.core.config import settings
from app.rag.ingestion.embedder import get_embedding_model
from app.rag.prompts.system_prompt import ADMISSION_ASSISTANT_SYSTEM_PROMPT


_SETTINGS_INITIALIZED = False


def get_vector_store() -> PGVectorStore:
    return PGVectorStore.from_params(
        host=settings.POSTGRES_HOST,
        port=settings.POSTGRES_PORT,
        database=settings.POSTGRES_DB,
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
        table_name="document_embeddings",
        embed_dim=384,
    )


def setup_llama_settings() -> None:
    global _SETTINGS_INITIALIZED

    # Configure explicit chunking parameters
    Settings.node_parser = SentenceSplitter(
        chunk_size=512,
        chunk_overlap=100
    )

    if _SETTINGS_INITIALIZED:
        return

    # LLM Setup
    if settings.LLM_PROVIDER.lower() == "gemini":
        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY is not set in the environment.")

        model_name = settings.GENERATIVE_MODEL or "gemini-2.5-flash"

        Settings.llm = GoogleGenAI(
            model=model_name,
            api_key=settings.GOOGLE_API_KEY,
            request_timeout=120.0,
            temperature=0.2,
            max_retries=3,
        )

    elif settings.LLM_PROVIDER.lower() == "ollama":
        Settings.llm = Ollama(
            model=settings.OLLAMA_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
            request_timeout=300.0,
        )
    else:
        raise ValueError(f"Unsupported LLM_PROVIDER: {settings.LLM_PROVIDER}")

    # Embedding Model Setup (with query instruction for BGE search)
    Settings.embed_model = get_embedding_model(with_query_instruction=True)

    _SETTINGS_INITIALIZED = True


def load_query_engine():
    setup_llama_settings()

    vector_store = get_vector_store()

    index = VectorStoreIndex.from_vector_store(
        vector_store=vector_store
    )

    qa_prompt = PromptTemplate(ADMISSION_ASSISTANT_SYSTEM_PROMPT)

    query_engine = index.as_query_engine(
        similarity_top_k=8,
        text_qa_template=qa_prompt,
        streaming=True,
    )

    return query_engine