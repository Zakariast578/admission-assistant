# app/services/document_service.py

import hashlib
import tempfile
import os
from pathlib import Path
from typing import Any
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from llama_index.core import SimpleDirectoryReader, StorageContext, VectorStoreIndex
from llama_index.core.schema import Document as LlamaDocument
from app.models.domain import Document
from app.rag.retrieval.query_engine import get_vector_store, setup_llama_settings
from app.rag.ingestion.loaders import _load_pdf_document
from app.rag.ingestion.chunker import chunk_documents
from app.core.logging_config import logger


def sanitize_text(text: str) -> str:
    if not text:
        return ""
    return text.replace("\x00", "").replace("\u0000", "")


def sanitize_metadata(metadata: dict[str, Any]) -> dict[str, Any]:
    cleaned = {}
    for key, value in metadata.items():
        if isinstance(value, str):
            cleaned[key] = sanitize_text(value)
        else:
            cleaned[key] = value
    return cleaned


def _load_documents_for_upload(tmp_path: str, file_ext: str) -> list[LlamaDocument]:
    """Route PDFs through the PyMuPDF extractor; everything else through SimpleDirectoryReader."""
    if file_ext.lower() == ".pdf":
        pdf_docs = _load_pdf_document(Path(tmp_path))
        if not pdf_docs:
            logger.warning(f"PyMuPDF extracted no text from '{tmp_path}'.")
        return pdf_docs

    return SimpleDirectoryReader(input_files=[tmp_path]).load_data()


async def process_and_store_document(
    file: UploadFile, db: AsyncSession
) -> Document:
    contents = await file.read()
    file_hash = hashlib.sha256(contents).hexdigest()

    result = await db.execute(
        select(Document).filter(Document.file_hash == file_hash)
    )
    existing_doc = result.scalars().first()
    if existing_doc:
        return existing_doc

    file_ext = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
        tmp_file.write(contents)
        tmp_path = tmp_file.name

    try:
        documents = _load_documents_for_upload(tmp_path, file_ext)

        if not documents:
            raise ValueError(
                f"No extractable text found in '{file.filename}'. "
                "The file may be scanned/image-based or corrupted."
            )

        for doc in documents:
            cleaned_text = sanitize_text(doc.get_content())
            doc.set_content(cleaned_text)
            doc.metadata = sanitize_metadata(doc.metadata)
            doc.metadata["file_name"] = file.filename
            doc.metadata["file_hash"] = file_hash

        # Initialize LlamaIndex Settings
        setup_llama_settings()

        # Chunk raw documents into structured nodes (512 size / 100 overlap)
        nodes = chunk_documents(documents, chunk_size=512, chunk_overlap=100)

        vector_store = get_vector_store()
        storage_context = StorageContext.from_defaults(
            vector_store=vector_store
        )

        # Ingest pre-chunked nodes into PostgreSQL
        VectorStoreIndex(
            nodes=nodes,
            storage_context=storage_context,
            show_progress=True
        )

        doc_record = Document(
            filename=file.filename, file_hash=file_hash, status="PROCESSED"
        )
        db.add(doc_record)
        await db.commit()
        await db.refresh(doc_record)

        return doc_record

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)