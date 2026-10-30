Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   WeatherGuard AI - Launching Backend & Frontend" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n[1/2] Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\backend'; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000"

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting React Frontend on http://localhost:5173 ..." -ForegroundColor Magenta
Set-Location "$rootDir\frontend"
npm run dev
