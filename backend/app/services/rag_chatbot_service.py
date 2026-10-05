import os
from pathlib import Path
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Resolve paths relative to backend root
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_DIR = BASE_DIR / "chroma_db"

def get_vector_store():
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return Chroma(
        persist_directory=str(DB_DIR),
        embedding_function=embeddings
    )

def ask_water_expert_chatbot(user_query: str, chat_history: list = None):
    """
    Queries the vector database for relevant WHO guidelines and generates a precise response using LCEL.
    """
    if chat_history is None:
        chat_history = []
        
    vector_store = get_vector_store()
    retriever = vector_store.as_retriever(search_kwargs={"k": 3}) # Retrieves top 3 matching chunks
    
    # Retrieve relevant documents from ChromaDB
    docs = retriever.get_relevant_documents(user_query)
    context = "\n\n".join([doc.page_content for doc in docs])
    sources = list(set([doc.metadata.get("source", "WHO Guidelines for Drinking-water Quality") for doc in docs]))
    
    # Initialize OpenAI LLM
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.3,
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )
    
    # Define prompt template for expert water quality remediation advice
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert AI assistant for water quality analysis and remediation based on official WHO guidelines. Answer the user's question accurately and thoroughly using only the provided context from the WHO guidelines.\n\nContext:\n{context}"),
        ("human", "{question}")
    ])
    
    # Construct LCEL chain
    chain = prompt | llm | StrOutputParser()
    
    answer = chain.invoke({
        "context": context, 
        "question": user_query
    })
    
    return {
        "answer": answer,
        "sources": sources if sources else ["WHO Guidelines for Drinking-water Quality"]
    }