# AquaXAI professional frontend — integration adapter

This folder is a drop-in replacement for the current `frontend/` UI layer, built around the repository that was inspected at `Adarshoffl/Aqua_XAI`.

## What is wired to the inspected backend

The only HTTP application endpoint found during inspection is:

- `POST /api/analyze-water`

The frontend sends the backend's actual required schema: Country, Waterbody_Type, Ammonia, Biochemical_Oxygen_Demand, Dissolved_Oxygen, Orthophosphate, pH, Temperature, Nitrogen, Nitrate, Year, Month, and optional question.

The analysis result page renders the response fields already present in the backend route: `prediction`, `shap`, `treatment`, and `generative_ai`.

## What is intentionally NOT faked

The current repository does not expose HTTP routes for login/signup/password reset, history, comparison, reports, assistant chat, profile, or settings. The UI therefore does not pretend those requests succeeded. Optional endpoint environment variables exist in `.env.example` so the corresponding pages can be connected when the backend exposes those routes.

For visual continuity, comparison/history/dashboard data is isolated in `src/data/mockData.js`; it is never mixed into the analysis API service.

## Important backend observation

The GitHub repository's `backend/app/main.py` includes `app.api.routes` under `/api`, and `routes.py` defines `/analyze-water`. The top-level `backend/main.py` is a separate minimal FastAPI app. Run the intended app as `uvicorn app.main:app` from `backend/` when using the `/api/analyze-water` application.

The model files include Git LFS-managed artifacts, so the actual local working copy must contain the binary model files. This frontend package does not modify or replace them.

## Run

```bash
cd frontend
npm install
npm start
```

For Docker, keep the existing `nginx.conf` proxy to the backend and the `/api` base path.
