import pandas as pd
import os


DATA_PATH = "/app/dataset/Combined_dataset.csv"


def load_dataset():

    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(
            f"Dataset not found at: {DATA_PATH}"
        )

    print("Loading dataset...")

    df = pd.read_csv(
        DATA_PATH,
        low_memory=False,
        nrows=200000
    )

    print("\nDataset Loaded Successfully")

    print("\nDataset Shape:")
    print(df.shape)

    print("\nColumns:")
    print(df.columns.tolist())

    print("\nData Types:")
    print(df.dtypes)

    print("\nMemory Usage:")
    memory = df.memory_usage(deep=True).sum() / (1024 ** 2)
    print(f"{memory:.2f} MB")

    print("\nMissing Values:")
    missing = df.isnull().sum()

    print(
        missing[missing > 0]
        .sort_values(ascending=False)
    )

    return df


if __name__ == "__main__":

    data = load_dataset()

    print("\nFirst 5 Records:")
    print(data.head())