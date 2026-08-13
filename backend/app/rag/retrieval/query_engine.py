from llama_index.core import VectorStoreIndex, Settings, PromptTemplate
from llama_index.vector_stores.postgres import PGVectorStore
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

from app.core.config import settings
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
    """
    Configure the global LlamaIndex Settings once.
    """

    global _SETTINGS_INITIALIZED

    if _SETTINGS_INITIALIZED:
        return

    # ---------------------------------------------------------
    # LLM
    # ---------------------------------------------------------

    if settings.LLM_PROVIDER.lower() == "gemini":

        if not settings.GOOGLE_API_KEY:
            raise ValueError(
                "GOOGLE_API_KEY is not set in the environment."
            )

        model_name = (
            settings.GENERATIVE_MODEL
            or "gemini-2.5-flash"
        )

        Settings.llm = GoogleGenAI(
            model=model_name,
            api_key=settings.GOOGLE_API_KEY,

            # LLM request timeout
            request_timeout=120.0,

            # More deterministic answers for admission questions
            temperature=0.2,

            # Retry transient Gemini failures
            max_retries=3,
        )

    elif settings.LLM_PROVIDER.lower() == "ollama":

        Settings.llm = Ollama(
            model=settings.OLLAMA_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
            request_timeout=300.0,
        )

    else:
        raise ValueError(
            f"Unsupported LLM_PROVIDER: {settings.LLM_PROVIDER}"
        )

    # ---------------------------------------------------------
    # Embedding model
    # ---------------------------------------------------------

    if not settings.EMBEDDING_MODEL:
        raise ValueError(
            "EMBEDDING_MODEL is not configured."
        )

    Settings.embed_model = HuggingFaceEmbedding(
        model_name=settings.EMBEDDING_MODEL
    )

    _SETTINGS_INITIALIZED = True


def load_query_engine():
    """
    Load the PostgreSQL vector store and create the
    LlamaIndex query engine.
    """

    setup_llama_settings()

    vector_store = get_vector_store()

    index = VectorStoreIndex.from_vector_store(
        vector_store=vector_store
    )

    qa_prompt = PromptTemplate(
        ADMISSION_ASSISTANT_SYSTEM_PROMPT
    )

    query_engine = index.as_query_engine(
        similarity_top_k=8,
        text_qa_template=qa_prompt,
        streaming=False,
    )

    return query_engine