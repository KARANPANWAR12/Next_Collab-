#!/bin/bash
# ─── NexCollab Backend Starter ────────────────────────────────────
set -e
GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'

echo -e "${BLUE}Starting NexCollab Backend...${NC}"

cd "$(dirname "$0")/backend"

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
  source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
  source venv/Scripts/activate
else
  echo "Virtual environment not found. Run ./setup.sh first."
  exit 1
fi

mkdir -p uploads

echo -e "${GREEN}✔ Backend running at:  http://127.0.0.1:8000${NC}"
echo -e "${GREEN}✔ API Docs at:         http://127.0.0.1:8000/docs${NC}"
echo -e "${GREEN}✔ WebSocket:           ws://127.0.0.1:8000/ws/{workspace_id}/{user_id}${NC}"
echo ""

uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level info
