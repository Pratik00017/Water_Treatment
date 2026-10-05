import os
from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

# Resolve paths relative to backend root
BASE_DIR = Path(__file__).resolve().parent.parent.parent
PDF_PATH = BASE_DIR / "WHO.pdf"
DB_DIR = BASE_DIR / "chroma_db"

def build_vector_database():
    if not PDF_PATH.exists():
        print(f"Error: WHO.pdf not found at {PDF_PATH}. Please place it in the backend root.")
        return

    print("Loading WHO.pdf guidelines...")
    loader = PyPDFLoader(str(PDF_PATH))
    documents = loader.load()

    print("Splitting text into optimal chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Total chunks created: {len(chunks)}")

    print("Generating vector embeddings using Sentence-Transformers (Local)...")
    # Using a lightweight, high-performance local embedding model from sentence-transformers
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    print("Saving vector embeddings to ChromaDB...")
    vector_db = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(DB_DIR)
    )
    print("Success! Vector database successfully built and stored in chroma_db.")

if __name__ == "__main__":
    build_vector_database()