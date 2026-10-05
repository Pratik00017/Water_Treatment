import sys
from pathlib import Path

# Explicitly add the backend folder to Python's system path
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.rag_chatbot_service import ask_water_expert_chatbot

print("Asking the WHO Water Expert Assistant a complex technical question...\n")

query = "What are the primary treatment methods for removing Arsenic according to the WHO guidelines?"
response = ask_water_expert_chatbot(user_query=query)

print("--- AI ASSISTANT ANSWER ---")
print(response["answer"])

print("\n--- RETRIEVED SOURCES ---")
for source in response["sources"]:
    print(f"- {source}")