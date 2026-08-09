from fastapi import APIRouter, Depends, HTTPException
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
    if not query_engine:
        logger.error("Query engine unavailable.")
        raise HTTPException(status_code=503, detail="Search engine initialized improperly.")

    cleaned_query = sanitize_input(request.message)
    logger.info(f"Received query: '{cleaned_query}'")

    try:
        # Use async query engine execution to prevent asyncio event loop conflicts
        response = await query_engine.aquery(cleaned_query)
        answer_text = str(response).strip()

        if not answer_text or answer_text.lower() == "empty response":
            answer_text = "Official information regarding this query was not found in the indexed university guidelines."

        return ChatResponse(answer=answer_text)

    except Exception as e:
        logger.error(f"Error during query synthesis: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to synthesize response.")