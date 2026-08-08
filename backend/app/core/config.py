import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Admission Assistant RAG API"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Hugging Face Settings
    HF_TOKEN: str = ""

    # LLM Settings
    LLM_PROVIDER: str = "openrouter"
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "inclusionai/ling-3.0-tiny:free"

    # Gemini Settings
    GOOGLE_API_KEY: str = ""
    GENERATIVE_MODEL: str = "gemini-1.5-pro"
    EMBEDDING_MODEL: str = "models/embedding-001"

    # Data Paths
    FAISS_INDEX_PATH: str = "data/processed/faiss_index"
    METADATA_DB_PATH: str = "data/processed/metadata.db"
    RAW_DOCS_PATH: str = "data/raw_documents"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

# Export HF_TOKEN globally to system environment for huggingface_hub library
if settings.HF_TOKEN:
    os.environ["HF_TOKEN"] = settings.HF_TOKEN