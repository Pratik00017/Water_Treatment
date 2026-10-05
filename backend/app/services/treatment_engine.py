from app.database.connection import SessionLocal
from app.models.water_models import Treatment


# ============================================================
# AQUA_XAI TREATMENT ENGINE
# ============================================================
#
# Important:
# - Treatment decisions use ACTUAL INPUT VALUES.
# - SHAP is NOT used to determine high/low conditions.
# - Only screening rules with clear project/reference
#   applicability are used.
# - If no rule is available, no treatment is invented.
#
# ============================================================


SCREENING_RULES = {

    # pH screening range commonly used for water-quality
    # assessment. Treatment records already exist for both
    # high and low pH.
    "pH": {
        "low": 6.5,
        "high": 8.5
    },

    # Project screening value for low dissolved oxygen.
    # This is a treatment-engine screening rule, not a
    # universal WHO health guideline.
    "Dissolved Oxygen": {
        "low": 5.0
    }
}


PARAMETER_MAPPING = {
    "Ammonia": "Ammonia",
    "Biochemical_Oxygen_Demand": "Biochemical Oxygen Demand",
    "Dissolved_Oxygen": "Dissolved Oxygen",
    "Orthophosphate": "Orthophosphate",
    "pH": "pH",
    "Temperature": "Temperature",
    "Nitrogen": "Nitrogen",
    "Nitrate": "Nitrate"
}


def determine_conditions(data: dict):

    conditions = []

    # --------------------------------------------------------
    # pH
    # --------------------------------------------------------

    ph = data.get("pH")

    if ph is not None:

        if ph < SCREENING_RULES["pH"]["low"]:

            conditions.append({
                "parameter": "pH",
                "condition": "Low",
                "value": ph,
                "basis": "Aqua_XAI pH screening rule: below 6.5"
            })

        elif ph > SCREENING_RULES["pH"]["high"]:

            conditions.append({
                "parameter": "pH",
                "condition": "High",
                "value": ph,
                "basis": "Aqua_XAI pH screening rule: above 8.5"
            })

    # --------------------------------------------------------
    # Dissolved Oxygen
    # --------------------------------------------------------

    dissolved_oxygen = data.get("Dissolved_Oxygen")

    if dissolved_oxygen is not None:

        if dissolved_oxygen < SCREENING_RULES[
            "Dissolved Oxygen"
        ]["low"]:

            conditions.append({
                "parameter": "Dissolved Oxygen",
                "condition": "Low",
                "value": dissolved_oxygen,
                "basis": (
                    "Aqua_XAI treatment-engine screening rule: "
                    "below 5.0 mg/L"
                )
            })

    return conditions


def get_treatment_recommendations(data: dict):

    db = SessionLocal()

    try:

        conditions = determine_conditions(data)

        recommendations = []

        for condition in conditions:

            records = (
                db.query(Treatment)
                .filter(
                    Treatment.parameter
                    == condition["parameter"],

                    Treatment.condition
                    == condition["condition"]
                )
                .all()
            )

            for record in records:

                recommendations.append({

                    "action_type":
                        "Corrective Treatment",

                    "parameter":
                        record.parameter,

                    "condition":
                        condition["condition"],

                    "value":
                        condition["value"],

                    "basis":
                        condition["basis"],

                    "treatment_name":
                        record.treatment_name,

                    "description":
                        record.description,

                    "working_principle":
                        record.working_principle,

                    "advantages":
                        record.advantages,

                    "limitations":
                        record.limitations,

                    "maintenance":
                        record.maintenance,

                    "estimated_cost":
                        record.estimated_cost,

                    "precautions":
                        record.precautions
                })

        return recommendations

    finally:

        db.close()