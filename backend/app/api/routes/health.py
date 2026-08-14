import os
from fastapi import APIRouter
from app.models.schemas import HealthCheckResponse
from app.core.config import settings

router = APIRouter()

@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    # Set index_loaded according to your current vector configuration or remove the check
    return HealthCheckResponse(
        status="ok",
        environment=settings.ENVIRONMENT,
        llm_provider=settings.LLM_PROVIDER,
        index_loaded=True
    )