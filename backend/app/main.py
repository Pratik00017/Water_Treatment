# Kept for backwards compatibility: the real entry point is backend/main.py
# (run with:  uvicorn main:app --reload   from inside the backend/ folder)
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app  # noqa: E402,F401
