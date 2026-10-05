from pydantic import BaseModel, Field
from typing import List, Optional


# ============================================================
# WATER QUALITY INPUT
# ============================================================

class WaterQualityInput(BaseModel):

    Country: str
    Waterbody_Type: str

    Ammonia: float
    Biochemical_Oxygen_Demand: float
    Dissolved_Oxygen: float
    Orthophosphate: float
    pH: float
    Temperature: float
    Nitrogen: float
    Nitrate: float

    Year: int
    Month: int

    # User question for RAG + Phi-3
    question: Optional[str] = None


# ============================================================
# SHAP EXPLANATION
# ============================================================

class FeatureImpact(BaseModel):

    feature: str
    importance: float


# ============================================================
# TREATMENT RECOMMENDATION
# ============================================================

class ActionRecommendation(BaseModel):

    action_type: str
    parameter: str

    condition: Optional[str] = None
    value: Optional[float] = None
    basis: Optional[str] = None

    treatment_name: str
    description: str
    working_principle: str
    advantages: str
    limitations: str
    maintenance: str
    estimated_cost: str
    precautions: str


# ============================================================
# WATER QUALITY RESPONSE
# ============================================================

class WaterQualityResponse(BaseModel):

    water_quality: str
    confidence: float

    explanation: List[FeatureImpact]

    recommended_actions: List[
        ActionRecommendation
    ] = Field(
        default_factory=list
    )

    ai_treatment_plan: Optional[str] = None