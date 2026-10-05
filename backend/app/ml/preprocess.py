import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.impute import SimpleImputer


def preprocess_data(df):

    print("Starting preprocessing...")


    # Copy dataset
    data = df.copy()

    # Remove high-cardinality location feature
    data.drop(
    [
        "Area",
        "CCME_Values"
    ],
    axis=1,
    inplace=True
)


    # -------------------------
    # Convert Date
    # -------------------------

    data["Date"] = pd.to_datetime(
    data["Date"],
    dayfirst=True
    )

    data["Year"] = data["Date"].dt.year
    data["Month"] = data["Date"].dt.month

    data.drop(
        "Date",
        axis=1,
        inplace=True
    )


    # -------------------------
    # Separate Target
    # -------------------------

    target_encoder = LabelEncoder()

    data["CCME_WQI"] = target_encoder.fit_transform(
        data["CCME_WQI"]
    )


    X = data.drop(
        "CCME_WQI",
        axis=1
    )

    y = data["CCME_WQI"]


    # -------------------------
    # Encode categorical features
    # -------------------------

    categorical_columns = X.select_dtypes(
    include=["object", "category"]
).columns

    encoders = {}


    for column in categorical_columns:

        encoder = LabelEncoder()

        X[column] = encoder.fit_transform(
            X[column].astype(str)
        )

        encoders[column] = encoder


    # -------------------------
    # Handle missing values
    # -------------------------

    imputer = SimpleImputer(
        strategy="median"
    )


    X = pd.DataFrame(
        imputer.fit_transform(X),
        columns=X.columns
    )

    # Memory optimization
    X = X.astype("float32")


    print("Preprocessing Completed")

    print("Features:")
    print(X.shape)

    print("Target:")
    print(y.shape)


    return (
        X,
        y,
        encoders,
        target_encoder,
        imputer
    )

if __name__ == "__main__":

    from data_loader import load_dataset

    df = load_dataset()

    X, y, encoders, target_encoder, imputer = preprocess_data(df)

    print(X.head())
    print(y.head())

    print(target_encoder.classes_)