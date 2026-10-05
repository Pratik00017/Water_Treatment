import os
import joblib
import pandas as pd
import numpy as np
import shap
import traceback


# ============================================================
# MODEL PATH
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "ml",
    "models"
)

print("Loading ML Models from:", MODEL_PATH)


# ============================================================
# LOAD MODELS
# ============================================================

model = joblib.load(
    os.path.join(
        MODEL_PATH,
        "random_forest.pkl"
    )
)

encoders = joblib.load(
    os.path.join(
        MODEL_PATH,
        "encoders.pkl"
    )
)

target_encoder = joblib.load(
    os.path.join(
        MODEL_PATH,
        "target_encoder.pkl"
    )
)

imputer = joblib.load(
    os.path.join(
        MODEL_PATH,
        "imputer.pkl"
    )
)

feature_columns = joblib.load(
    os.path.join(
        MODEL_PATH,
        "feature_columns.pkl"
    )
)


# ============================================================
# SHAP
# ============================================================

print("Initializing SHAP TreeExplainer...")

explainer = shap.TreeExplainer(model)

print("ML Model and Explainer Loaded Successfully")


# ============================================================
# SAFE NUMBER
# ============================================================

def number(value, default=None):
    try:
        if value is None:
            return default

        result = float(value)

        if np.isnan(result):
            return default

        return result

    except Exception:
        return default


# ============================================================
# SHAP EXTRACTION
# ============================================================

def extract_shap_values(
    shap_values,
    predicted_class_index,
    feature_count
):
    """
    Supports different SHAP versions.

    Possible formats:

    Old SHAP:
        list[class][sample][feature]

    New SHAP:
        ndarray[sample][feature][class]

    Binary/single output:
        ndarray[sample][feature]

    shap.Explanation:
        .values
    """

    try:

        # ----------------------------------------------------
        # SHAP Explanation object
        # ----------------------------------------------------

        if hasattr(shap_values, "values"):
            shap_values = shap_values.values


        # ----------------------------------------------------
        # List returned by older SHAP versions
        # ----------------------------------------------------

        if isinstance(shap_values, list):

            if len(shap_values) == 0:
                raise ValueError(
                    "SHAP returned an empty list."
                )

            class_index = min(
                predicted_class_index,
                len(shap_values) - 1
            )

            values = np.asarray(
                shap_values[class_index]
            )

            if values.ndim == 2:
                values = values[0]

            elif values.ndim == 1:
                values = values

            else:
                values = values.reshape(-1)

            return values[:feature_count]


        # ----------------------------------------------------
        # Convert to numpy
        # ----------------------------------------------------

        values = np.asarray(
            shap_values
        )


        # ----------------------------------------------------
        # 3D:
        #
        # (samples, features, classes)
        # ----------------------------------------------------

        if values.ndim == 3:

            # Most current SHAP format
            if (
                values.shape[0] == 1
                and values.shape[1] == feature_count
            ):

                class_index = min(
                    predicted_class_index,
                    values.shape[2] - 1
                )

                return values[
                    0,
                    :,
                    class_index
                ]


            # Alternative format:
            # (samples, classes, features)

            if (
                values.shape[0] == 1
                and values.shape[2] == feature_count
            ):

                class_index = min(
                    predicted_class_index,
                    values.shape[1] - 1
                )

                return values[
                    0,
                    class_index,
                    : 
                ]


            # Fallback
            values = values.reshape(
                values.shape[0],
                -1
            )[0]

            return values[:feature_count]


        # ----------------------------------------------------
        # 2D:
        #
        # (samples, features)
        # ----------------------------------------------------

        if values.ndim == 2:

            if values.shape[0] >= 1:

                return values[
                    0,
                    :feature_count
                ]


        # ----------------------------------------------------
        # 1D
        # ----------------------------------------------------

        if values.ndim == 1:

            return values[
                :feature_count
            ]


        raise ValueError(
            f"Unsupported SHAP shape: {values.shape}"
        )

    except Exception:

        traceback.print_exc()

        # Do NOT crash the entire water analysis
        # because of a visualization explanation.

        return np.zeros(
            feature_count,
            dtype=float
        )


# ============================================================
# WATER QUALITY RECOMMENDATIONS
# ============================================================

def get_recommendations(data, prediction):
    """
    Recommendations are based on the actual measured
    water parameters.

    This is a deterministic treatment/monitoring engine.
    SHAP is NOT used to invent treatment actions.
    """

    recommendations = []

    ph = number(
        data.get("pH")
    )

    temperature = number(
        data.get("Temperature")
    )

    do = number(
        data.get("Dissolved_Oxygen")
    )

    bod = number(
        data.get("Biochemical_Oxygen_Demand")
    )

    nitrate = number(
        data.get("Nitrate")
    )

    ammonia = number(
        data.get("Ammonia")
    )

    nitrogen = number(
        data.get("Nitrogen")
    )

    orthophosphate = number(
        data.get("Orthophosphate")
    )


    # ========================================================
    # pH
    # ========================================================

    if ph is not None:

        if ph < 6.5:

            recommendations.append(
                "pH is below the recommended range. "
                "Consider controlled alkalinity adjustment "
                "and retest the water after treatment."
            )

        elif ph > 8.5:

            recommendations.append(
                "pH is above the recommended range. "
                "Investigate the source of alkalinity "
                "and retest after corrective treatment."
            )


    # ========================================================
    # DISSOLVED OXYGEN
    # ========================================================

    if do is not None:

        if do < 5:

            recommendations.append(
                "Dissolved oxygen is low. "
                "Investigate organic pollution and consider "
                "aeration or improved water circulation."
            )


    # ========================================================
    # BOD
    # ========================================================

    if bod is not None:

        if bod >= 5:

            recommendations.append(
                "BOD is elevated, indicating increased organic "
                "matter. Identify and control organic waste "
                "sources and improve biological treatment."
            )


    # ========================================================
    # NITRATE
    # ========================================================

    if nitrate is not None:

        if nitrate >= 10:

            recommendations.append(
                "Nitrate is elevated. Investigate agricultural "
                "runoff or wastewater sources and consider "
                "appropriate nitrate-removal treatment."
            )


    # ========================================================
    # AMMONIA
    # ========================================================

    if ammonia is not None:

        if ammonia >= 1:

            recommendations.append(
                "Ammonia is elevated. Investigate sewage or "
                "organic contamination and consider biological "
                "nitrification treatment."
            )


    # ========================================================
    # NITROGEN
    # ========================================================

    if nitrogen is not None:

        if nitrogen >= 10:

            recommendations.append(
                "Nitrogen concentration is elevated. "
                "Investigate nutrient sources and consider "
                "nutrient-removal treatment."
            )


    # ========================================================
    # ORTHOPHOSPHATE
    # ========================================================

    if orthophosphate is not None:

        if orthophosphate >= 1:

            recommendations.append(
                "Orthophosphate is elevated. Investigate "
                "fertilizer or wastewater sources and consider "
                "phosphorus-removal treatment."
            )


    # ========================================================
    # TEMPERATURE
    # ========================================================

    if temperature is not None:

        if temperature > 30:

            recommendations.append(
                "Water temperature is elevated. Monitor thermal "
                "pollution and investigate possible heat sources."
            )


    # ========================================================
    # SAFE SAMPLE
    # ========================================================

    if len(recommendations) == 0:

        if str(prediction).lower() in [
            "good",
            "safe",
            "excellent",
            "acceptable"
        ]:

            recommendations.append(
                "Water quality parameters are within the "
                "monitored reference ranges. Continue routine "
                "water-quality monitoring and periodic testing."
            )

        else:

            recommendations.append(
                "Continue routine monitoring of the water sample "
                "and retest periodically to identify changes "
                "in water quality."
            )


    return recommendations


# ============================================================
# MAIN PREDICTION
# ============================================================

def predict_water_quality(data: dict):

    try:

        print(
            "\n========================================"
        )

        print(
            "AquaXAI Water Analysis Started"
        )

        print(
            "========================================"
        )


        # ====================================================
        # 1. MAP FRONTEND DATA TO MODEL FEATURES
        # ====================================================

        mapped_data = {

            "Country":
                data["Country"],

            "Waterbody Type":
                data["Waterbody_Type"],

            "Ammonia (mg/l)":
                data["Ammonia"],

            "Biochemical Oxygen Demand (mg/l)":
                data["Biochemical_Oxygen_Demand"],

            "Dissolved Oxygen (mg/l)":
                data["Dissolved_Oxygen"],

            "Orthophosphate (mg/l)":
                data["Orthophosphate"],

            "pH (ph units)":
                data["pH"],

            "Temperature (cel)":
                data["Temperature"],

            "Nitrogen (mg/l)":
                data["Nitrogen"],

            "Nitrate (mg/l)":
                data["Nitrate"],

            "Year":
                data["Year"],

            "Month":
                data["Month"],
        }


        print(
            "Input mapping completed."
        )


        # ====================================================
        # 2. DATAFRAME
        # ====================================================

        df = pd.DataFrame(
            [mapped_data]
        )


        # ====================================================
        # 3. ENCODE CATEGORICAL FEATURES
        # ====================================================

        for column, encoder in encoders.items():

            try:

                df[column] = encoder.transform(
                    df[column]
                )

            except ValueError:

                print(
                    f"Unknown category in {column}. "
                    "Using first known category."
                )

                default_value = (
                    encoder.classes_[0]
                )

                df[column] = encoder.transform(
                    [default_value]
                )


        # ====================================================
        # 4. FEATURE ORDER
        # ====================================================

        df = df[
            feature_columns
        ]


        # ====================================================
        # 5. IMPUTATION
        # ====================================================

        df_imputed = imputer.transform(
            df
        )

        df_processed = pd.DataFrame(
            df_imputed,
            columns=feature_columns
        )


        # ====================================================
        # 6. ML PREDICTION
        # ====================================================

        prediction = model.predict(
            df_processed
        )

        probabilities = model.predict_proba(
            df_processed
        )


        predicted_class_index = int(
            prediction[0]
        )


        predicted_label = (
            target_encoder
            .inverse_transform(
                prediction
            )[0]
        )


        confidence = float(
            probabilities.max() * 100
        )


        print(
            "Prediction:",
            predicted_label
        )

        print(
            "Confidence:",
            round(confidence, 2)
        )


        # ====================================================
        # 7. SHAP
        # ====================================================

        print(
            "Generating SHAP explanation..."
        )

        shap_values = explainer.shap_values(
            df_processed
        )


        shap_vector = extract_shap_values(
            shap_values,
            predicted_class_index,
            len(feature_columns)
        )


        # Make sure length matches feature count
        if len(shap_vector) != len(feature_columns):

            fixed = np.zeros(
                len(feature_columns),
                dtype=float
            )

            length = min(
                len(shap_vector),
                len(feature_columns)
            )

            fixed[:length] = (
                shap_vector[:length]
            )

            shap_vector = fixed


        # ====================================================
        # 8. BUILD SHAP EXPLANATION
        # ====================================================

        explanation = []

        for index, feature_name in enumerate(
            feature_columns
        ):

            importance = float(
                shap_vector[index]
            )

            explanation.append({

                "feature":
                    str(feature_name),

                "importance":
                    round(
                        importance,
                        6
                    ),

                "direction":
                    (
                        "positive"
                        if importance >= 0
                        else "negative"
                    )
            })


        # Strongest features first
        explanation.sort(
            key=lambda item:
                abs(
                    item["importance"]
                ),
            reverse=True
        )


        print(
            "SHAP features generated:",
            len(explanation)
        )


        # ====================================================
        # 9. RECOMMENDATIONS
        # ====================================================

        print(
            "Generating recommendations..."
        )

        recommended_actions = (
            get_recommendations(
                data,
                predicted_label
            )
        )


        print(
            "Recommendations:",
            recommended_actions
        )


        # ====================================================
        # 10. RESPONSE
        # ====================================================

        result = {

            "water_quality":
                str(predicted_label),

            "prediction":
                str(predicted_label),

            "confidence":
                round(
                    confidence,
                    2
                ),

            "explanation":
                explanation,

            "shap_explanation":
                explanation,

            "recommended_actions":
                recommended_actions,

            "recommendations":
                recommended_actions,

            "ai_treatment_plan":
                recommended_actions,

            "input_data":
                data
        }


        print(
            "========================================"
        )

        print(
            "AquaXAI Analysis Completed Successfully"
        )

        print(
            "========================================"
        )


        return result


    except Exception as err:

        print(
            "\n----- REAL ML ERROR -----"
        )

        traceback.print_exc()

        raise ValueError(
            f"ML Processing Error: {str(err)}"
        )