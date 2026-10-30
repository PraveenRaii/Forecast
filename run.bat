@echo off
title WeatherGuard AI Launcher
echo ========================================================
echo   WeatherGuard AI - Launching Backend and Frontend
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "WeatherGuard AI Backend" cmd /k "cd backend && .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

timeout /t 2 /nobreak >nul

echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
cd frontend
npm run dev

pause
