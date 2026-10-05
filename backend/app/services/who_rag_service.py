from pathlib import Path
import re

import ollama
import chromadb


# ============================================================
# PATHS
# ============================================================

APP_DIR = Path(__file__).resolve().parents[1]

CHROMA_PATH = APP_DIR / "knowledge_base" / "chroma_db"

COLLECTION_NAME = "aqua_xai_who"

EMBEDDING_MODEL = "nomic-embed-text:latest"
LLM_MODEL = "tinyllama:latest"

TOP_K = 3


# ============================================================
# CHROMA
# ============================================================

client = chromadb.PersistentClient(
    path=str(CHROMA_PATH)
)


# ============================================================
# SAFE COLLECTION LOADING
# ============================================================

collection = None

try:
    collection = client.get_collection(
        name=COLLECTION_NAME
    )

    print(
        f"WHO Chroma collection loaded: {COLLECTION_NAME}"
    )

except Exception as e:

    print(
        f"WARNING: WHO Chroma collection not available: {e}"
    )

    print(
        "Aqua_XAI will continue without WHO RAG."
    )


# ============================================================
# EMBEDDING
# ============================================================

def create_embedding(text: str):

    response = ollama.embeddings(
        model=EMBEDDING_MODEL,
        prompt=text
    )

    return response["embedding"]


# ============================================================
# WHO RETRIEVAL
# ============================================================

def retrieve_who_context(user_question: str):

    # WHO database is not available
    if collection is None:

        return (
            "WHO knowledge base is currently unavailable.",
            []
        )

    try:

        query_embedding = create_embedding(
            user_question
        )

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=TOP_K
        )

        documents = results.get(
            "documents",
            [[]]
        )[0]

        metadatas = results.get(
            "metadatas",
            [[]]
        )[0]

        distances = results.get(
            "distances",
            [[]]
        )[0]

        context_parts = []

        sources = []

        for index, document in enumerate(documents):

            metadata = (
                metadatas[index]
                if index < len(metadatas)
                else {}
            )

            distance = (
                distances[index]
                if index < len(distances)
                else None
            )

            source = metadata.get(
                "source",
                "WHO.pdf"
            )

            page = metadata.get(
                "page",
                "Unknown"
            )

            context_parts.append(
                f"""
WHO SOURCE
Document: {source}
Page: {page}

{document}
"""
            )

            sources.append(
                {
                    "document": source,
                    "page": page,
                    "distance": distance
                }
            )

        if not context_parts:

            return (
                "No relevant WHO information was retrieved.",
                []
            )

        return (
            "\n\n".join(context_parts),
            sources
        )

    except Exception as e:

        print(
            f"WHO retrieval error: {e}"
        )

        return (
            "WHO knowledge base is currently unavailable.",
            []
        )


# ============================================================
# EXTRACT WHO NITRATE EVIDENCE
# ============================================================

def extract_nitrate_evidence(
    who_context: str
):

    text = " ".join(
        who_context.split()
    )

    lower_text = text.lower()

    evidence = []

    # --------------------------------------------------------
    # Guideline value
    # --------------------------------------------------------

    if (
        "guideline value for nitrate of 50 mg/l"
        in lower_text
        or
        "guideline value for nitrate"
        in lower_text
    ):

        evidence.append(
            "WHO guideline value for nitrate: "
            "50 mg/L as nitrate ion."
        )

    # --------------------------------------------------------
    # Bottle-fed infants
    # --------------------------------------------------------

    if "bottle-fed infants" in lower_text:

        evidence.append(
            "WHO states that the nitrate guideline "
            "is protective for bottle-fed infants."
        )

    # --------------------------------------------------------
    # Microbiological safety
    # --------------------------------------------------------

    if (
        "microbiologically safe" in lower_text
        and
        "bottle-fed infants" in lower_text
    ):

        evidence.append(
            "WHO emphasizes that water used for "
            "bottle-fed infants should be microbiologically "
            "safe when nitrate is near or above the guideline value."
        )

    # --------------------------------------------------------
    # Health effects
    # --------------------------------------------------------

    if "methaemoglobinaemia" in lower_text:

        evidence.append(
            "The WHO guideline is based on evidence "
            "concerning methaemoglobinaemia and thyroid effects."
        )

    return evidence


# ============================================================
# FORMAT SHAP
# ============================================================

def format_shap(shap_results):

    lines = []

    for item in shap_results[:5]:

        feature = item.get(
            "feature",
            "Unknown"
        )

        importance = item.get(
            "importance",
            0
        )

        try:

            importance = float(
                importance
            )

            lines.append(
                f"- {feature}: {importance:.4f}"
            )

        except Exception:

            lines.append(
                f"- {feature}: {importance}"
            )

    if not lines:

        return "No SHAP explanation available."

    return "\n".join(lines)


# ============================================================
# FORMAT TREATMENTS
# ============================================================

def format_treatments(
    treatment_recommendation
):

    if not treatment_recommendation:

        return (
            "No treatment recommendation was generated "
            "by the Aqua_XAI treatment engine."
        )

    lines = []

    for item in treatment_recommendation:

        lines.append(
            f"""
- {item.get('treatment_name', 'Unknown')}
  Parameter: {item.get('parameter', 'Unknown')}
  Condition: {item.get('condition', 'Unknown')}
  Measured value: {item.get('value', 'Unknown')}
  Basis: {item.get('basis', 'Unknown')}
"""
        )

    return "\n".join(lines)


# ============================================================
# GENERATIVE AI
# ============================================================

def generate_grounded_answer(
    water_quality_data: dict,
    ml_prediction: dict,
    shap_results: list,
    treatment_recommendation: list,
    user_question: str = None
):

    if not user_question:

        user_question = (
            "Explain the current Aqua_XAI "
            "water quality analysis."
        )

    # ========================================================
    # SHAP
    # ========================================================

    shap_text = format_shap(
        shap_results
    )

    # ========================================================
    # TREATMENT
    # ========================================================

    treatment_text = format_treatments(
        treatment_recommendation
    )

    # ========================================================
    # WHO RAG
    # ========================================================

    who_context, sources = retrieve_who_context(
        user_question
    )

    # ========================================================
    # WHO EVIDENCE
    # ========================================================

    nitrate_evidence = extract_nitrate_evidence(
        who_context
    )

    if nitrate_evidence:

        who_evidence = "\n".join(
            [
                f"- {item}"
                for item in nitrate_evidence
            ]
        )

    else:

        who_evidence = (
            "No specific WHO nitrate evidence is currently available."
        )

    # ========================================================
    # PROMPT
    # ========================================================

    prompt = f"""
You are Aqua_XAI, a water-quality AI assistant.

USER QUESTION:
{user_question}

ML RESULT:
Prediction: {ml_prediction.get("label")}
Confidence: {ml_prediction.get("confidence")}%

SHAP:
{shap_text}

AQUA_XAI TREATMENTS:
{treatment_text}

WHO EVIDENCE:
{who_evidence}

IMPORTANT:

The WHO knowledge base may be unavailable.

Do not invent WHO information.

Answer the user's question directly.

STRICT RULES:

1. Stay only on water quality.

2. Do not invent facts.

3. Do not change numerical values.

4. Do not invent treatments.

5. Treatment recommendations come from Aqua_XAI.

6. SHAP values must be reproduced accurately.

7. Do not discuss patients, medicines, antibiotics,
   doctors, or unrelated medical topics.

8. Keep the answer concise.

OUTPUT:

### Aqua_XAI Result

Prediction and confidence.

### Key Factors

Top SHAP factors.

### Treatment Guidance

Actual Aqua_XAI treatment recommendations.

### WHO Evidence

Relevant WHO information, if available.

### Answer to Your Question

Direct answer to the user's question.

### Important Note

Mention laboratory verification where appropriate.
"""

    # ========================================================
    # PHI-3
    # ========================================================

    try:

        response = ollama.chat(
            model=LLM_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are Aqua_XAI, a water-quality "
                        "assistant. Answer only water-quality "
                        "questions using supplied information."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            options={
                "temperature": 0.0,
                "num_ctx": 4096,
                "num_predict": 500
            }
        )

        answer = (
            response["message"]["content"]
            .strip()
        )

    except Exception as e:

        print(
            f"Ollama generation error: {e}"
        )

        answer = (
            "### Aqua_XAI Result\n\n"
            f"Prediction: {ml_prediction.get('label')}\n"
            f"Confidence: {ml_prediction.get('confidence')}%\n\n"

            "### Key Factors\n\n"
            f"{shap_text}\n\n"

            "### Treatment Guidance\n\n"
            f"{treatment_text}\n\n"

            "### WHO Evidence\n\n"
            f"{who_evidence}\n\n"

            "### Answer to Your Question\n\n"
            "The Aqua_XAI analysis is available, "
            "but the generative AI service is currently unavailable."
        )


    # ========================================================
    # HALLUCINATION GUARD
    # ========================================================

    forbidden_terms = [
        "patient",
        "amoxicillin",
        "antibiotic",
        "antibiotics",
        "fever",
        "cough",
        "sputum",
        "doctor",
        "medicine",
        "medication"
    ]

    hallucination_detected = any(
        term.lower() in answer.lower()
        for term in forbidden_terms
    )


    # ========================================================
    # FALLBACK
    # ========================================================

    if hallucination_detected:

        answer = (
            "### Aqua_XAI Result\n\n"
            f"Prediction: {ml_prediction.get('label')}\n"
            f"Confidence: {ml_prediction.get('confidence')}%\n\n"

            "### Key Factors\n\n"
            f"{shap_text}\n\n"

            "### Treatment Guidance\n\n"
            f"{treatment_text}\n\n"

            "### WHO Evidence\n\n"
            f"{who_evidence}\n\n"

            "### Answer to Your Question\n\n"
            "The response was restricted to water-quality "
            "information because unrelated medical content "
            "was detected.\n\n"

            "### Important Note\n\n"
            "Laboratory verification is recommended "
            "where appropriate."
        )


    # ========================================================
    # GUARANTEE TREATMENTS
    # ========================================================

    if treatment_recommendation:

        lower_answer = answer.lower()

        missing = []

        for item in treatment_recommendation:

            name = item.get(
                "treatment_name",
                ""
            )

            if (
                name
                and
                name.lower() not in lower_answer
            ):

                missing.append(
                    f"- {name}"
                )

        if missing:

            answer += (
                "\n\n### Treatment Guidance\n\n"
                +
                "\n".join(missing)
            )


    # ========================================================
    # CLEANUP
    # ========================================================

    answer = answer.replace(
        "00.0426",
        "0.0426"
    )

    answer = answer.replace(
        "0 end",
        "0.0426"
    )

    answer = answer.replace(
        "atmospheral",
        "atmospheric"
    )

    answer = re.sub(
        r"\n###\s*$",
        "",
        answer
    )

    while "\n\n\n" in answer:

        answer = answer.replace(
            "\n\n\n",
            "\n\n"
        )

    answer = answer.strip()


    # ========================================================
    # RETURN
    # ========================================================

    return {
        "answer": answer,
        "sources": sources
    }
