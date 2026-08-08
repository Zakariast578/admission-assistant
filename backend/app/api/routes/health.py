import os
from fastapi import APIRouter
from app.models.schemas import HealthCheckResponse
from app.core.config import settings

router = APIRouter()


@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    index_exists = os.path.exists(settings.FAISS_INDEX_PATH)
    return HealthCheckResponse(
        status="ok",
        environment=settings.ENVIRONMENT,
        llm_provider=settings.LLM_PROVIDER,
        index_loaded=index_exists
    )