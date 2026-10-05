@echo off
REM One-command launcher (Windows): backend on :8000, frontend on :5173
cd /d "%~dp0"

if not exist .venv (
  python -m venv .venv
)
call .venv\Scripts\activate.bat
pip install -q -r backend\requirements.txt

if not exist frontend\node_modules (
  pushd frontend
  call npm install
  popd
)

start "Aqua XAI - Backend" cmd /k "cd /d %~dp0backend && ..\.venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000"
start "Aqua XAI - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Backend : http://localhost:8000/docs
echo Frontend: http://localhost:5173
timeout /t 5 >nul
start http://localhost:5173
