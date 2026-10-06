import hashlib
import hmac
import json
import secrets
from datetime import datetime

import ollama

from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas import WaterQualityInput
from app.services.prediction import predict_water_quality
from app.database.connection import get_db
from app.models.water_models import User


router = APIRouter()


# ============================================================
# HELPERS
# ============================================================

def get_user_id_from_header(
    x_user_id: str | None,
) -> int | None:
    """
    Frontend sends the logged-in user's ID using:

        X-User-ID: 1

    If the header is missing, None is returned.
    """

    if not x_user_id:
        return None

    try:
        user_id = int(x_user_id)

        if user_id <= 0:
            return None

        return user_id

    except (TypeError, ValueError):
        return None


# ============================================================
# DATABASE: ANALYSIS HISTORY TABLE
# PostgreSQL compatible
# ============================================================

def ensure_history_table(db: Session):

    db.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS aqua_analysis_history (
                id SERIAL PRIMARY KEY,

                user_id INTEGER NULL,

                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                sample_data TEXT NULL,

                prediction VARCHAR(100) NULL,

                confidence DOUBLE PRECISION NULL,

                treatment TEXT NULL
            )
            """
        )
    )

    db.commit()

    # --------------------------------------------------------
    # Add user_id to old table if it already existed
    # --------------------------------------------------------

    try:
        db.execute(
            text(
                """
                ALTER TABLE aqua_analysis_history
                ADD COLUMN IF NOT EXISTS user_id INTEGER NULL
                """
            )
        )

        db.commit()

    except Exception:
        db.rollback()


# ============================================================
# AUTHENTICATION SCHEMAS
# ============================================================

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ============================================================
# PASSWORD HASHING
# ============================================================

def hash_password(password: str) -> str:

    salt = secrets.token_bytes(16)

    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        200_000,
    )

    return (
        "pbkdf2_sha256$"
        + salt.hex()
        + "$"
        + password_hash.hex()
    )


def verify_password(
    password: str,
    stored_password: str,
) -> bool:

    try:

        algorithm, salt_hex, hash_hex = (
            stored_password.split("$")
        )

        if algorithm != "pbkdf2_sha256":
            return False

        salt = bytes.fromhex(salt_hex)

        password_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            200_000,
        )

        return hmac.compare_digest(
            password_hash.hex(),
            hash_hex,
        )

    except Exception:
        return False


# ============================================================
# SIGNUP
# ============================================================

@router.post("/signup")
def signup(
    request: SignupRequest,
    db: Session = Depends(get_db),
):

    name = request.name.strip()
    email = request.email.lower().strip()

    if len(name) < 2:
        raise HTTPException(
            status_code=400,
            detail="Name must contain at least 2 characters.",
        )

    if len(request.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 6 characters.",
        )

    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        )

    user = User(
        name=name,
        email=email,
        password=hash_password(
            request.password
        ),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "status": "success",
        "message": "Account created successfully.",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        },
    }


# ============================================================
# LOGIN
# ============================================================

@router.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):

    email = request.email.lower().strip()

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    if not verify_password(
        request.password,
        user.password,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    return {
        "status": "success",
        "message": "Login successful.",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        },
    }


# ============================================================
# CHAT
# ============================================================

class ChatRequest(BaseModel):
    question: str
    context: dict | None = None


# ============================================================
# WATER ANALYSIS
# ============================================================

@router.post("/analyze-water")
async def analyze_water(
    sample: WaterQualityInput,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(
        default=None,
        alias="X-User-ID",
    ),
):

    try:

        # ----------------------------------------------------
        # Get logged-in user
        # ----------------------------------------------------

        user_id = get_user_id_from_header(
            x_user_id
        )

        # ----------------------------------------------------
        # Make sure history table exists
        # ----------------------------------------------------

        ensure_history_table(db)

        # ----------------------------------------------------
        # Read submitted parameters
        # ----------------------------------------------------

        sample_data = sample.model_dump()

        # Question is not an ML feature
        user_question = sample_data.pop(
            "question",
            None,
        )

        # If frontend/schema happens to send user_id,
        # don't pass it to the ML model.
        sample_data.pop(
            "user_id",
            None,
        )

        # ----------------------------------------------------
        # ML + SHAP + Treatment
        # ----------------------------------------------------

        ml_result = predict_water_quality(
            sample_data
        )

        prediction_label = ml_result.get(
            "water_quality",
            "Unknown",
        )

        confidence = ml_result.get(
            "confidence",
            0,
        )

        shap_explanation = ml_result.get(
            "explanation",
            [],
        )

        treatment = ml_result.get(
            "recommended_actions",
            [],
        )

        # ----------------------------------------------------
        # Normalize treatment
        # ----------------------------------------------------

        if treatment is None:
            treatment = []

        if isinstance(
            treatment,
            str,
        ):
            treatment = [treatment]

        if not isinstance(
            treatment,
            list,
        ):
            treatment = [treatment]

        # ----------------------------------------------------
        # Save analysis history
        # ----------------------------------------------------

        db.execute(
            text(
                """
                INSERT INTO aqua_analysis_history
                (
                    user_id,
                    created_at,
                    sample_data,
                    prediction,
                    confidence,
                    treatment
                )
                VALUES
                (
                    :user_id,
                    :created_at,
                    :sample_data,
                    :prediction,
                    :confidence,
                    :treatment
                )
                """
            ),
            {
                "user_id": user_id,

                "created_at": datetime.now(),

                "sample_data": json.dumps(
                    sample_data,
                    default=str,
                ),

                "prediction": str(
                    prediction_label
                ),

                "confidence": float(
                    confidence
                ),

                "treatment": json.dumps(
                    treatment,
                    default=str,
                ),
            },
        )

        db.commit()

        # ----------------------------------------------------
        # IMPORTANT:
        # Return the exact structures needed by
        # AnalysisResult.jsx
        # ----------------------------------------------------

        return {
            "status": "success",

            # User
            "user_id": user_id,

            # Submitted water parameters
            "input_data": sample_data,

            # Prediction
            "prediction": {
                "label": prediction_label,
                "confidence": confidence,
            },

            # Also provide simple versions for
            # frontend compatibility
            "predicted_class": prediction_label,
            "confidence": confidence,

            # SHAP
            "shap": shap_explanation,
            "shap_values": shap_explanation,

            # Recommendations
            "treatment": treatment,
            "recommendations": treatment,

            # AI
            "generative_ai": {
                "question": user_question,
                "answer": None,
                "who_sources": [],
            },

            # Timestamp
            "created_at": datetime.now().isoformat(),
        }

    except Exception as e:

        db.rollback()

        print(
            "ERROR in /analyze-water:"
        )

        print(str(e))

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# ANALYSIS HISTORY
# ============================================================

@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(
        default=None,
        alias="X-User-ID",
    ),
):

    try:

        user_id = get_user_id_from_header(
            x_user_id
        )

        ensure_history_table(db)

        # ----------------------------------------------------
        # IMPORTANT:
        # Each user sees ONLY their own history.
        # ----------------------------------------------------

        if user_id is not None:

            result = db.execute(
                text(
                    """
                    SELECT
                        id,
                        created_at,
                        sample_data,
                        prediction,
                        confidence,
                        treatment,
                        user_id
                    FROM aqua_analysis_history
                    WHERE user_id = :user_id
                    ORDER BY created_at DESC
                    LIMIT 50
                    """
                ),
                {
                    "user_id": user_id
                },
            )

        else:

            # No user ID means no private history should
            # be exposed.
            return {
                "status": "success",
                "count": 0,
                "analyses": [],
            }

        rows = result.mappings().all()

        analyses = []

        for row in rows:

            # ------------------------------------------------
            # Sample data
            # ------------------------------------------------

            sample_data = {}

            if row["sample_data"]:

                try:

                    sample_data = json.loads(
                        row["sample_data"]
                    )

                except Exception:

                    sample_data = {}

            # ------------------------------------------------
            # Treatment
            # ------------------------------------------------

            treatment = row["treatment"]

            if treatment:

                try:

                    treatment = json.loads(
                        treatment
                    )

                except Exception:
                    pass

            # ------------------------------------------------
            # Prediction
            # ------------------------------------------------

            prediction = (
                row["prediction"]
                or "Unknown"
            )

            prediction_lower = (
                prediction.lower()
            )

            # ------------------------------------------------
            # Status
            # ------------------------------------------------

            if (
                "critical"
                in prediction_lower
                or "unsafe"
                in prediction_lower
                or "contaminated"
                in prediction_lower
            ):

                status = "Critical"

            elif (
                "treatment"
                in prediction_lower
                or "poor"
                in prediction_lower
                or "warning"
                in prediction_lower
                or "moderate"
                in prediction_lower
            ):

                status = "Needs Treatment"

            else:

                status = "Safe"

            # ------------------------------------------------
            # Return history item
            # ------------------------------------------------

            analyses.append(
                {
                    "id": row["id"],

                    "user_id": row["user_id"],

                    "date": (
                        row["created_at"].isoformat()
                        if row["created_at"]
                        else None
                    ),

                    "sample": (
                        f"Analysis #{row['id']}"
                    ),

                    "summary": prediction,

                    "status": status,

                    "prediction": prediction,

                    "confidence": row[
                        "confidence"
                    ],

                    "parameters": sample_data,

                    "input_data": sample_data,

                    "treatment": treatment,

                    "recommendations": treatment,
                }
            )

        return {
            "status": "success",
            "count": len(analyses),
            "analyses": analyses,
        }

    except Exception as e:

        print(
            "ERROR in /history:"
        )

        print(str(e))

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# AQUA ASSISTANT
# ============================================================

@router.post("/chat")
def chat(
    request: ChatRequest,
):

    context = request.context or {}

    prompt = f"""
You are Aqua Assistant for the Aqua XAI water-quality analysis system.

Answer only questions related to water quality, water-quality analysis,
machine learning, SHAP, treatment recommendations, and the current analysis.

User question:

{request.question}

Current analysis context:

{context}

Do not invent numerical values.

Do not invent SHAP values.

Use the supplied analysis context when available.

Keep the answer clear and concise.
"""

    try:

        response = ollama.chat(
            model="tinyllama:latest",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are Aqua Assistant, a concise "
                        "water-quality assistant."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            options={
                "temperature": 0.2,
                "num_ctx": 2048,
                "num_predict": 250,
            },
        )

        answer = response[
            "message"
        ][
            "content"
        ].strip()

        return {
            "status": "success",
            "answer": answer,
        }

    except Exception as e:

        print(
            "ERROR in /chat:"
        )

        print(str(e))

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )