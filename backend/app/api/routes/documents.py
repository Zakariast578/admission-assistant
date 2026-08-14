import os
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.dependencies import get_db
from app.models.domain import Document
from app.services.document_service import process_and_store_document

router = APIRouter(prefix="/documents", tags=["Documents CRUD"])

# Configure base directory where files are saved on disk
UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Standard media types mapping for file previews/downloads
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
    """
    Uploads a document, saves a physical copy to UPLOAD_DIR, and
    indexes its text embeddings into PostgreSQL vector store.
    """
    if not file.filename.lower().endswith(('.pdf', '.docx', '.txt')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload PDF, DOCX, or TXT."
        )

    try:
        # Save physical copy to disk so GET /{document_id}/file can serve it
        file_path = UPLOAD_DIR / file.filename
        file_bytes = await file.read()
        
        with open(file_path, "wb") as f:
            f.write(file_bytes)

        # Reset byte cursor position so LlamaIndex can process it in memory
        await file.seek(0)

        # Process and generate 384-dim embeddings into PostgreSQL PGVectorStore
        doc_record = await process_and_store_document(file=file, db=db)

        # Save local file path back onto the record if supported by your model
        if hasattr(doc_record, "file_path"):
            doc_record.file_path = str(file_path)
            await db.commit()
            await db.refresh(doc_record)

        return {
            "message": "Document processed, stored on disk, and indexed into PostgreSQL successfully.",
            "id": str(doc_record.id),
            "filename": doc_record.filename,
            "status": doc_record.status
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and index document: {str(e)}"
        )


@router.get("/", response_model=List[dict])
async def list_documents(db: AsyncSession = Depends(get_db)):
    """
    Lists all documents ordered by upload date.
    """
    result = await db.execute(select(Document).order_by(Document.uploaded_at.desc()))
    docs = result.scalars().all()

    return [
        {
            "id": str(doc.id),
            "title": getattr(doc, "title", doc.filename),
            "category": getattr(doc, "category", "General"),
            "file_name": doc.filename,
            "status": doc.status,
            "upload_date": doc.uploaded_at.strftime("%Y-%m-%d") if getattr(doc, "uploaded_at", None) else ""
        }
        for doc in docs
    ]


@router.get("/{document_id}/file")
async def get_document_file(document_id: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieves and streams the raw document file from disk.
    """
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document metadata not found.")

    ext = "." + doc.filename.rsplit(".", 1)[-1].lower() if "." in doc.filename else ""
    media_type = MEDIA_TYPES.get(ext, "application/octet-stream")

    # Locate file on disk
    if hasattr(doc, "file_path") and doc.file_path:
        file_disk_path = Path(doc.file_path)
    else:
        file_disk_path = UPLOAD_DIR / doc.filename

    if not file_disk_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="File content not found on server disk."
        )

    return FileResponse(
        path=str(file_disk_path),
        media_type=media_type,
        filename=doc.filename
    )


@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
async def delete_document(document_id: str, db: AsyncSession = Depends(get_db)):
    """
    Deletes the metadata record from PostgreSQL and removes the file from disk.
    """
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document metadata not found.")

    # Remove physical file if it exists on disk
    file_disk_path = Path(getattr(doc, "file_path", UPLOAD_DIR / doc.filename))
    if file_disk_path.exists():
        os.remove(file_disk_path)

    await db.delete(doc)
    await db.commit()
    return {"message": f"Document record {document_id} and corresponding file deleted successfully."}