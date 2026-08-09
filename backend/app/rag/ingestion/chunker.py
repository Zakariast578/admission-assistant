from typing import List
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.schema import BaseNode, Document
from app.core.logging_config import logger


def chunk_documents(documents: List[Document], chunk_size: int = 768, chunk_overlap: int = 124) -> List[BaseNode]:
    """Splits raw documents into smaller semantic nodes with overlapping boundaries."""
    logger.info(f"Splitting {len(documents)} documents with chunk_size={chunk_size}, overlap={chunk_overlap}")
    
    splitter = SentenceSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    
    nodes = splitter.get_nodes_from_documents(documents)
    logger.info(f"Generated {len(nodes)} structural text chunks (nodes).")
    return nodes