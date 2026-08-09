from typing import Any, Optional
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