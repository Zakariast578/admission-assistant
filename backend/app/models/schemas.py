from typing import Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=2,
        max_length=2000,
        description="User admission or academic policy query."
    )
    conversation_id: Optional[str] = Field(
        default=None,
        description="Optional session tracker for context continuity."
    )


class ChatResponse(BaseModel):
    answer: str


class HealthCheckResponse(BaseModel):
    status: str
    environment: str
    llm_provider: str
    index_loaded: bool
    version: str = "1.0.0"