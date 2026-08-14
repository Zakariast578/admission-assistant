import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.domain import Conversation, ChatMessage as DBMessage
from app.rag.retrieval.query_engine import load_query_engine

router = APIRouter(prefix="/chat", tags=["Chat Engine"])


class ChatPayload(BaseModel):
    message: str
    conversation_id: Optional[str] = None


@router.post("/stream")
async def stream_chat_endpoint(
    payload: ChatPayload, db: AsyncSession = Depends(get_db)
):
    conversation_id = payload.conversation_id

    # 1. Get or create conversation
    if conversation_id:
        result = await db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )
    else:
        conversation = Conversation()
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        conversation_id = conversation.id

    # 2. Save user message to database
    user_msg = DBMessage(
        conversation_id=conversation_id, sender="user", text=payload.message
    )
    db.add(user_msg)
    await db.commit()

    # 3. Load RAG query engine
    query_engine = await run_in_threadpool(load_query_engine)

    # 4. Stream Generator Function
    async def stream_generator():
        # Execute query off main thread
        response_stream = await run_in_threadpool(
            query_engine.query, payload.message
        )
        
        full_text = ""

        # Stream individual token chunks safely from generator
        for token in response_stream.response_gen:
            full_text += token
            # Yield token as SSE payload
            yield f"data: {json.dumps({'token': token})}\n\n"

        # Save assistant message on stream completion
        assistant_msg = DBMessage(
            conversation_id=conversation_id,
            sender="assistant",
            text=full_text,
        )
        db.add(assistant_msg)
        await db.commit()

        # Send completion event
        final_meta = {
            "done": True,
            "conversation_id": conversation_id,
            "answer": full_text
        }
        yield f"data: {json.dumps(final_meta)}\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")