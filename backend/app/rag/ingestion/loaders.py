from pathlib import Path
from typing import Iterable, List

import pymupdf
from llama_index.core import Document
from llama_index.core.readers import SimpleDirectoryReader

from app.core.logging_config import logger


def _load_pdf_document(pdf_path: Path) -> List[Document]:
    documents: List[Document] = []

    try:
        pdf = pymupdf.open(str(pdf_path))
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.error(f"Failed to open PDF '{pdf_path}': {exc}")
        return documents

    for page_index in range(pdf.page_count):
        page = pdf.load_page(page_index)
        text = page.get_text("text") or ""
        cleaned_text = "\n".join(line.rstrip() for line in text.splitlines()).strip()

        if not cleaned_text:
            logger.warning(f"Skipping empty PDF page {page_index + 1} in '{pdf_path.name}'.")
            continue

        documents.append(
            Document(
                text=cleaned_text,
                metadata={
                    "file_path": str(pdf_path),
                    "file_name": pdf_path.name,
                    "file_type": "application/pdf",
                    "page_number": page_index + 1,
                    "source": "pymupdf",
                },
            )
        )

    pdf.close()
    return documents


def load_documents_from_directory(directory_path: str) -> List[Document]:
    return load_documents_from_directories([directory_path])


def load_documents_from_directories(directory_paths: Iterable[str]) -> List[Document]:
    """Load readable content from multiple document roots using robust PDF extraction."""
    documents: List[Document] = []
    pdf_paths: List[Path] = []
    non_pdf_files: List[Path] = []

    for directory_path in directory_paths:
        path = Path(directory_path)
        if not path.exists() or not any(path.iterdir()):
            logger.warning(f"Directory '{directory_path}' is empty or does not exist.")
            continue

        pdf_paths.extend(sorted(path.rglob("*.pdf")))
        non_pdf_files.extend(
            sorted(
                file_path
                for file_path in path.rglob("*")
                if file_path.is_file() and file_path.suffix.lower() in {".docx", ".html", ".txt", ".md"}
            )
        )

    for pdf_path in pdf_paths:
        logger.info(f"Extracting PDF text with PyMuPDF from: {pdf_path}")
        documents.extend(_load_pdf_document(pdf_path))

    if non_pdf_files:
        reader = SimpleDirectoryReader(
            input_files=[str(file_path) for file_path in non_pdf_files],
        )
        loaded_documents = reader.load_data()
        logger.info(f"Loaded {len(loaded_documents)} non-PDF documents from the configured sources.")
        documents.extend(loaded_documents)

    logger.info(f"Successfully loaded {len(documents)} document pages/sections across all sources.")
    return documents