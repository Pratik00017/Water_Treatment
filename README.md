# Aqua XAI – Explainable Water Quality Analysis

React (Vite + Tailwind) frontend + FastAPI backend (Random-Forest model, SHAP explanations,
treatment recommendations, optional WHO-grounded LLM answers via Ollama).

## Quick start

**Windows:** double-click `run.bat`
**macOS / Linux:** `./run.sh`

Then open **http://localhost:5173** (API docs: http://localhost:8000/docs).

Requirements: Python 3.10–3.12, Node.js 18+.

### Manual start
```bash
# backend
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
cd backend && uvicorn main:app --reload --port 8000

# frontend (second terminal)
cd frontend && npm install && npm run dev
```

### Docker
```bash
docker compose up --build        # app on http://localhost
docker exec aqua_ollama ollama pull tinyllama
docker exec aqua_ollama ollama pull nomic-embed-text
```

## Standalone preview (no backend needed)
`preview/aqua-xai-preview.html` – open it in a browser. It is a self-contained demo of the UI
using simulated predictions stored in localStorage. (It is also served by the dev server at
`/aqua-xai-preview.html`.) The real app never fakes predictions; they always come from the backend.

## Configuration
| What | How |
|---|---|
| API URL for frontend | `frontend/.env` → `VITE_API_BASE_URL` (default `http://localhost:8000/api`) |
| Database | Default is SQLite (`backend/aquaxai.db`, auto-created and seeded). For MySQL set `DATABASE_URL=mysql+pymysql://user:pass@host:3306/aquaxai` |
| Extra CORS origins | `CORS_ORIGINS=https://a.com,https://b.com` |
| Ollama | Optional. Without it the API still returns prediction, SHAP and treatments, with a templated summary instead of an LLM answer. Models used: `tinyllama`, `nomic-embed-text`. |

## Notes
- WHO knowledge base: the Chroma index is not shipped (it was empty/incompatible). Rebuild it with `backend/vector_ingest.py` if you have the WHO PDF.
- `dataset/Combined_dataset.csv` (≈320 MB) was left out of the zip to keep it small; it is only needed for retraining (`backend/app/ml/train_model.py`). Trained models are included in `backend/app/ml/models/`.
- Login/register is frontend-only (localStorage) – the backend has no auth endpoints.
