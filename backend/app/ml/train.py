import time

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, f1_score

from xgboost import XGBClassifier

from data_loader import load_dataset
from preprocess import preprocess_data


def train_models():

    start_time = time.time()

    print("\nLoading dataset...")

    df = load_dataset()

    print("\nOriginal dataset:", df.shape)

    # Use a manageable sample for training
    if len(df) > 200000:
        df = df.sample(
            n=200000,
            random_state=42
        ).reset_index(drop=True)

    print("Training dataset:", df.shape)

    # -------------------------
    # Preprocess
    # -------------------------

    X, y, encoders, target_encoder, imputer = preprocess_data(df)

    # -------------------------
    # Train Test Split
    # -------------------------

    print("\nSplitting dataset...")

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    print("Training samples:", X_train.shape)
    print("Testing samples:", X_test.shape)

    # -------------------------
    # Random Forest
    # -------------------------

    print("\nTraining Random Forest...")

    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=20,
        n_jobs=2,
        random_state=42
    )

    rf_model.fit(
        X_train,
        y_train
    )

    rf_prediction = rf_model.predict(X_test)

    rf_accuracy = accuracy_score(
        y_test,
        rf_prediction
    )

    rf_f1 = f1_score(
        y_test,
        rf_prediction,
        average="weighted"
    )

    print("\nRandom Forest Results")
    print("---------------------")
    print("Accuracy:", rf_accuracy)
    print("F1 Score:", rf_f1)

    # -------------------------
    # XGBoost
    # -------------------------

    print("\nTraining XGBoost...")

    xgb_model = XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        tree_method="hist",
        n_jobs=2,
        random_state=42
    )

    xgb_model.fit(
        X_train,
        y_train
    )

    xgb_prediction = xgb_model.predict(X_test)

    xgb_accuracy = accuracy_score(
        y_test,
        xgb_prediction
    )

    xgb_f1 = f1_score(
        y_test,
        xgb_prediction,
        average="weighted"
    )

    print("\nXGBoost Results")
    print("----------------")
    print("Accuracy:", xgb_accuracy)
    print("F1 Score:", xgb_f1)

    print("\nClassification Report:")

    print(
        classification_report(
            y_test,
            xgb_prediction,
            target_names=target_encoder.classes_
        )
    )

    total_time = (time.time() - start_time) / 60

    print(
        f"\nTotal Training Time: {total_time:.2f} minutes"
    )

    return (
        rf_model,
        xgb_model,
        encoders,
        target_encoder,
        imputer,
        X.columns
    )


if __name__ == "__main__":
    train_models()