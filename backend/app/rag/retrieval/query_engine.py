from llama_index.core import VectorStoreIndex, Settings
from llama_index.vector_stores.postgres import PGVectorStore
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

from app.core.config import settings

def get_vector_store() -> PGVectorStore:
    return PGVectorStore.from_params(
        host=settings.POSTGRES_HOST,
        port=settings.POSTGRES_PORT,
        database=settings.POSTGRES_DB,
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
        table_name="document_embeddings",
        embed_dim=384
    )

def setup_llama_settings():
    if settings.LLM_PROVIDER == "gemini":
        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY is not set in .env")
            
        # Use valid model name (e.g., gemini-2.5-flash)
        model_name = settings.GENERATIVE_MODEL if settings.GENERATIVE_MODEL else "gemini-2.5-flash"

        Settings.llm = GoogleGenAI(
            model=model_name,
            api_key=settings.GOOGLE_API_KEY,
            request_timeout=120.0
        )
    else:
        Settings.llm = Ollama(
            model=settings.OLLAMA_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
            request_timeout=300.0,
            additional_kwargs={"timeout": 300.0}
        )

    Settings.embed_model = HuggingFaceEmbedding(
        model_name=settings.EMBEDDING_MODEL
    )

def load_query_engine():
    setup_llama_settings()
    vector_store = get_vector_store()
    index = VectorStoreIndex.from_vector_store(vector_store=vector_store)
    return index.as_query_engine(similarity_top_k=5, response_mode="tree_summarize", streaming=True)