import hashlib
import tempfile
import os
from typing import Any
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from llama_index.core import SimpleDirectoryReader, StorageContext, VectorStoreIndex
from app.models.domain import Document
from app.rag.retrieval.query_engine import get_vector_store, setup_llama_settings


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


async def process_and_store_document(
    file: UploadFile, db: AsyncSession
) -> Document:
    contents = await file.read()
    file_hash = hashlib.sha256(contents).hexdigest()

    # Check for existing duplicate document
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
        documents = SimpleDirectoryReader(input_files=[tmp_path]).load_data()

        for doc in documents:
            cleaned_text = sanitize_text(doc.get_content())
            doc.set_content(cleaned_text)
            doc.metadata = sanitize_metadata(doc.metadata)
            doc.metadata["file_name"] = file.filename
            doc.metadata["file_hash"] = file_hash

        setup_llama_settings()
        vector_store = get_vector_store()
        storage_context = StorageContext.from_defaults(
            vector_store=vector_store
        )

        VectorStoreIndex.from_documents(
            documents, storage_context=storage_context, show_progress=True
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