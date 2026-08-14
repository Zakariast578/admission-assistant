# debug_retrieval.py
from app.rag.retrieval.query_engine import setup_llama_settings, get_vector_store
from llama_index.core import VectorStoreIndex

setup_llama_settings()
vector_store = get_vector_store()
index = VectorStoreIndex.from_vector_store(vector_store=vector_store)

retriever = index.as_retriever(similarity_top_k=8)
nodes = retriever.retrieve("What are the admission requirements?")

print(f"Retrieved {len(nodes)} nodes")
for n in nodes:
    print("---")
    print(f"score={n.score}")
    print(n.node.get_content()[:200])