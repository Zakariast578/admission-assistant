import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Admission Assistant RAG API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development" 
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    LOG_LEVEL: str = "INFO"
    
    # LLM Settings
    LLM_PROVIDER: str = "gemini"
    GOOGLE_API_KEY: str = ""
    GENERATIVE_MODEL: str = "gemini-3.6-flash"
    
    # Embeddings (384 dimensions)
    HF_TOKEN: str = ""
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"

    # CORS Settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # Database Settings
    POSTGRES_USER: str = "snu_admin"
    POSTGRES_PASSWORD: str = "snu_password_123"
    POSTGRES_HOST: str = "127.0.0.1"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "snu_admissions_db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

if settings.HF_TOKEN:
    os.environ["HF_TOKEN"] = settings.HF_TOKEN