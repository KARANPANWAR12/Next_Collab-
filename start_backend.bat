@echo off
:: NexCollab Backend Starter (Windows)
echo Starting NexCollab Backend...

cd /d "%~dp0backend"

if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo Virtual environment not found. Run setup.bat first.
    pause
    exit /b 1
)

if not exist "uploads" mkdir uploads

echo.
echo Backend running at:  http://127.0.0.1:8000
echo API Docs at:         http://127.0.0.1:8000/docs
echo.

uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level info
pause
