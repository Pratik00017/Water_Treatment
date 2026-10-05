import os
import joblib

from train import train_models


MODEL_DIR = "/app/app/ml/models"


def save_models():

    print("Starting model training and saving...")

    (
        rf_model,
        xgb_model,
        encoders,
        target_encoder,
        imputer,
        feature_columns
    ) = train_models()

    # Create model directory
    os.makedirs(
        MODEL_DIR,
        exist_ok=True
    )

    # Save Random Forest model
    joblib.dump(
        rf_model,
        f"{MODEL_DIR}/random_forest.pkl"
    )

    # Save XGBoost model
    joblib.dump(
        xgb_model,
        f"{MODEL_DIR}/xgboost.pkl"
    )

    # Save preprocessing encoders
    joblib.dump(
        encoders,
        f"{MODEL_DIR}/encoders.pkl"
    )

    # Save target encoder
    joblib.dump(
        target_encoder,
        f"{MODEL_DIR}/target_encoder.pkl"
    )

    # Save imputer
    joblib.dump(
        imputer,
        f"{MODEL_DIR}/imputer.pkl"
    )

    # Save feature columns as a normal Python list
    joblib.dump(
        list(feature_columns),
        f"{MODEL_DIR}/feature_columns.pkl"
    )

    print("\nModels saved successfully!")

    print("\nSaved files:")

    for file in os.listdir(MODEL_DIR):
        print(file)


if __name__ == "__main__":
    save_models()