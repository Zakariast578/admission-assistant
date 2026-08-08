from fastapi import APIRouter, Depends
from app.models.schemas import ChatRequest, ChatResponse
from app.api.dependencies import get_query_engine
from app.utils.validators import sanitize_input
from app.core.logging_config import logger

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    query_engine=Depends(get_query_engine)
):
    cleaned_query = sanitize_input(request.message)
    logger.info(f"Received query: '{cleaned_query}'")

    response = query_engine.query(cleaned_query)

    return ChatResponse(
        answer=str(response)
    )