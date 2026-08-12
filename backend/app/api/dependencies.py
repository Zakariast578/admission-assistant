from typing import Any, Optional, AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db  # Import get_db from core.database
from app.rag.retrieval.query_engine import load_query_engine
from app.utils.exceptions import IndexNotReadyException

_query_engine_instance: Optional[Any] = None

def get_query_engine() -> Any:
    global _query_engine_instance
    if _query_engine_instance is None:
        _query_engine_instance = load_query_engine()

    if _query_engine_instance is None:
        raise IndexNotReadyException()

    return _query_engine_instance

# Re-export get_db so dependencies.py serves as a single source for FastAPI Depends()
__all__ = ["get_db", "get_query_engine"]