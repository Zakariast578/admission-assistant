# test_chat.py
import sys
from pathlib import Path

# Adds 'backend' directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Keep your original import
from app.rag.retrieval.query_engine import load_query_engine

query_engine = load_query_engine()
response = query_engine.query("What are the admission requirements?")

print("\n--- ASSISTANT RESPONSE ---")
print(str(response))