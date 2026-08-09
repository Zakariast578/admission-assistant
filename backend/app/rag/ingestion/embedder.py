from llama_index.embeddings.huggingface import HuggingFaceEmbedding

EMBEDDING_MODEL_NAME = "BAAI/bge-small-en-v1.5"
QUERY_INSTRUCTION = "Represent this sentence for searching relevant passages:"


def get_embedding_model(with_query_instruction: bool = False) -> HuggingFaceEmbedding:
	"""Return the shared embedding model used during both indexing and retrieval."""
	if with_query_instruction:
		return HuggingFaceEmbedding(
			model_name=EMBEDDING_MODEL_NAME,
			query_instruction=QUERY_INSTRUCTION,
		)

	return HuggingFaceEmbedding(model_name=EMBEDDING_MODEL_NAME)
