#!/bin/bash
# ─── NexCollab Frontend Starter ───────────────────────────────────
set -e
GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'

echo -e "${BLUE}Starting NexCollab Frontend...${NC}"

cd "$(dirname "$0")/frontend"

if [ ! -d "node_modules" ]; then
  echo "node_modules not found. Running npm install..."
  npm install --legacy-peer-deps
fi

echo -e "${GREEN}✔ Frontend running at: http://localhost:5173${NC}"
echo ""

npm run dev
