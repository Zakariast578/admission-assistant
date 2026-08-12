import os
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.domain import Document
from app.services.document_service import process_and_store_document

router = APIRouter(prefix="/documents", tags=["Documents CRUD"])

# Configure base directory where files are saved
UPLOAD_DIR = Path("data/uploads") 

# Map file extensions to their standard media types
MEDIA_TYPES = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
}

@router.post("/upload", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.endswith(('.pdf', '.docx', '.txt')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Unsupported file format. Please upload PDF, DOCX, or TXT."
        )

    doc_record = await process_and_store_document(file, db)
    return {
        "message": "Document processed and indexed into PostgreSQL vector database successfully.",
        "id": doc_record.id,
        "filename": doc_record.filename,
        "status": doc_record.status
    }

@router.get("/", response_model=List[dict])
async def list_documents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).order_by(Document.uploaded_at.desc()))
    docs = result.scalars().all()
    
    return [
        {
            "id": str(doc.id),
            "title": getattr(doc, "title", doc.filename),
            "category": getattr(doc, "category", "General"),
            "file_name": doc.filename,
            "status": doc.status,
            "upload_date": doc.uploaded_at.strftime("%Y-%m-%d") if doc.uploaded_at else ""
        }
        for doc in docs
    ]

@router.get("/{document_id}/file")
async def get_document_file(document_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document metadata not found.")

    # Determine media type based on filename extension
    ext = "." + doc.filename.rsplit(".", 1)[-1].lower() if "." in doc.filename else ""
    media_type = MEDIA_TYPES.get(ext, "application/octet-stream")

    # Locate path on disk via file_hash attribute or path constructor
    if hasattr(doc, "file_path"):
        file_disk_path = Path(doc.file_path)
    elif hasattr(doc, "file_hash") and doc.file_hash:
        # Fallback if stored under UPLOAD_DIR with file_hash or filename
        file_disk_path = UPLOAD_DIR / doc.filename
    else:
        file_disk_path = UPLOAD_DIR / doc.filename

    if not file_disk_path.exists():
        raise HTTPException(status_code=404, detail="File content not found on server disk.")

    return FileResponse(
        path=str(file_disk_path),
        media_type=media_type,
        filename=doc.filename
    )

@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
async def delete_document(document_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document metadata not found.")

    await db.delete(doc)
    await db.commit()
    return {"message": f"Document record {document_id} deleted."}