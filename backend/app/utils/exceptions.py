from fastapi import HTTPException, status


class IndexNotReadyException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="FAISS vector store is not built or unavailable. Run ingestion first."
        )


class LLMProviderException(HTTPException):
    def __init__(self, message: str):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM Provider Error: {message}"
        )