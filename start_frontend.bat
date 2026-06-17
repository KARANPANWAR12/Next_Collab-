@echo off
:: NexCollab Frontend Starter (Windows)
echo Starting NexCollab Frontend...

cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo node_modules not found. Running npm install...
    npm install --legacy-peer-deps
)

echo.
echo Frontend running at: http://localhost:5173
echo.

npm run dev
pause
