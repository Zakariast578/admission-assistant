from pathlib import Path
from typing import List
from llama_index.core import Document
from llama_index.core.readers import SimpleDirectoryReader
from app.core.logging_config import logger


def load_documents_from_directory(directory_path: str) -> List[Document]:
    """Scans and extracts text content from raw PDF, DOCX, and HTML files."""
    path = Path(directory_path)
    if not path.exists() or not any(path.iterdir()):
        logger.warning(f"Directory '{directory_path}' is empty or does not exist.")
        return []

    logger.info(f"Loading raw documents from: {directory_path}")
    
    # Supported extensions
    required_exts = [".pdf", ".docx", ".html", ".txt"]
    
    reader = SimpleDirectoryReader(
        input_dir=directory_path,
        required_exts=required_exts,
        recursive=True
    )
    
    documents = reader.load_data()
    logger.info(f"Successfully loaded {len(documents)} document pages/sections.")
    return documents