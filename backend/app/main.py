from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging_config import logger
from app.api.routes import health, chat, documents

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route inclusion under /api/v1
app.include_router(health.router, prefix=settings.API_V1_STR, tags=["Health"])
app.include_router(chat.router, prefix=settings.API_V1_STR, tags=["Chat"])
app.include_router(documents.router, prefix=settings.API_V1_STR, tags=["Documents"])


@app.get("/")
async def root():
    logger.info("Root endpoint accessed.")
    return {
        "project": settings.PROJECT_NAME,
        "status": "running",
        "provider": settings.LLM_PROVIDER
    }