import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.database.connection import Base, engine
from app.models import water_models  # noqa: F401  (registers tables)
from seed_treatments import seed_treatments


app = FastAPI(
    title="Aqua_XAI API",
    description="Explainable AI Based Water Quality Prediction System",
    version="1.0",
)

# CORS: Vite dev server (5173), nginx/docker (80), and anything in CORS_ORIGINS
_origins = [
    "http://localhost",
    "http://127.0.0.1",
    "http://localhost:80",
    "http://127.0.0.1:80",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
_origins += [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def init_database():
    """Create tables and seed the treatment knowledge base on first run."""
    Base.metadata.create_all(bind=engine)
    seed_treatments()


app.include_router(router, prefix="/api")


@app.get("/")
def home():
    return {"message": "Aqua_XAI API is running"}


@app.get("/api/health")
def health():
    return {"status": "ok"}
