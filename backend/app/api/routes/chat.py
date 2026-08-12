from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from llama_index.core.llms import ChatMessage as LlamaChatMessage, MessageRole

from app.core.database import get_db
from app.models.domain import Conversation, ChatMessage as DBMessage
from app.rag.retrieval.query_engine import load_query_engine

router = APIRouter(tags=["Chat Engine"])

class ChatPayload(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    conversation_id: str
    answer: str

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    payload: ChatPayload,
    db: AsyncSession = Depends(get_db)
):
    conversation_id = payload.conversation_id

    # Get or create conversation
    if conversation_id:
        result = await db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
    else:
        conversation = Conversation()
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        conversation_id = conversation.id

    # Save user message
    user_msg = DBMessage(
        conversation_id=conversation_id,
        sender="user",
        text=payload.message
    )
    db.add(user_msg)
    await db.commit()

    # Retrieve history
    history_result = await db.execute(
        select(DBMessage)
        .where(DBMessage.conversation_id == conversation_id)
        .order_by(DBMessage.created_at.asc())
    )
    chat_history_records = history_result.scalars().all()

    # Query RAG Engine off-thread
    query_engine = await run_in_threadpool(load_query_engine)
    response = await run_in_threadpool(query_engine.query, payload.message)
    answer_text = str(response)

    # Save assistant message
    assistant_msg = DBMessage(
        conversation_id=conversation_id,
        sender="assistant",
        text=answer_text
    )
    db.add(assistant_msg)
    await db.commit()

    return ChatResponse(
        conversation_id=conversation_id,
        answer=answer_text
    )