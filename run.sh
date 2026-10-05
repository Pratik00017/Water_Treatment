#!/usr/bin/env bash
# One-command launcher (macOS / Linux): backend on :8000, frontend on :5173
set -e
cd "$(dirname "$0")"

if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
. .venv/bin/activate
pip install -q -r backend/requirements.txt

if [ ! -d frontend/node_modules ]; then
  (cd frontend && npm install)
fi

(cd backend && uvicorn main:app --reload --port 8000) &
BACK=$!
trap "kill $BACK 2>/dev/null" EXIT

echo ""
echo "Backend : http://localhost:8000/docs"
echo "Frontend: http://localhost:5173"
echo ""
cd frontend && npm run dev
