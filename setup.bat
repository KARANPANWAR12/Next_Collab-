@echo off
:: NexCollab v2.0 Setup (Windows)
setlocal

echo ============================================
echo   NexCollab v2.0 - Windows Setup
echo ============================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install from https://python.org
    pause & exit /b 1
)

:: Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org
    pause & exit /b 1
)

echo [OK] Prerequisites found
echo.

:: Database reminder
echo [!] Make sure PostgreSQL is running.
echo [!] Create database manually if not done:
echo        psql -U postgres -c "CREATE DATABASE nexcollab;"
echo.

:: Backend
echo --- Setting up Backend ---
cd /d "%~dp0backend"
python -m venv venv
call venv\Scripts\activate.bat
pip install --upgrade pip -q
pip install -r requirements.txt -q
if not exist "uploads" mkdir uploads
echo [OK] Backend ready
cd ..

:: Frontend
echo --- Setting up Frontend ---
cd /d "%~dp0frontend"
npm install --legacy-peer-deps
echo [OK] Frontend ready
cd ..

echo.
echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo   1. Start backend:   start_backend.bat
echo   2. Start frontend:  start_frontend.bat  (new window)
echo   3. Open browser:    http://localhost:5173
echo.
pause
