from app.services.who_rag_service import retrieve_who_context


question = "What does WHO say about nitrate in drinking water?"


context, sources = retrieve_who_context(
    question
)


print("\n==============================")
print("USER QUESTION")
print("==============================")
print(question)


print("\n==============================")
print("RETRIEVED WHO SOURCES")
print("==============================")

for source in sources:
    print(source)


print("\n==============================")
print("RETRIEVED CONTEXT")
print("==============================")

print(context)