import json
import os
from pathlib import Path
from openai import OpenAI

# Resolve path to backend/who_treatments.json relative to this file
BASE_DIR = Path(__file__).resolve().parent.parent.parent
JSON_PATH = BASE_DIR / "who_treatments.json"

with open(JSON_PATH, "r", encoding="utf-8") as f:
    who_knowledge_base = json.load(f)

def retrieve_who_treatment(shap_top_feature: str) -> str:
    shap_lower = shap_top_feature.lower()
    
    for item in who_knowledge_base:
        user_query = item["messages"][1]["content"].lower()
        if any(keyword in user_query for keyword in shap_lower.split()):
            return item["messages"][2]["content"]
            
    return who_knowledge_base[0]["messages"][2]["content"]

def generate_water_remediation_advice(ml_prediction_result: str, shap_top_feature: str, user_parameters: dict) -> str:
    retrieved_treatment_protocol = retrieve_who_treatment(shap_top_feature)
    
    system_prompt = (
        "You are an expert water treatment AI operating strictly within the "
        "World Health Organization (WHO) Guidelines for drinking-water quality."
    )
    
    user_prompt = f"""
    The machine learning model analyzed the water sample and returned the following prediction:
    - Status: {ml_prediction_result}
    - User Input Parameters: {user_parameters}
    - Key Driver (SHAP Explanation): The primary parameter causing this classification is '{shap_top_feature}'.

    Relevant WHO Treatment Guidelines Retrieved:
    {retrieved_treatment_protocol}

    Based on this data, provide a clear, actionable remediation plan for the user, 
    explaining why '{shap_top_feature}' is dangerous and how to treat it using the WHO guidelines above.
    """

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.2
    )
    
    return response.choices[0].message.content