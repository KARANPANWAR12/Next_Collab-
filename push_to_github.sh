#!/bin/bash
# ─── NexCollab – Push to GitHub ────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'

echo -e "${BLUE}━━━ NexCollab GitHub Push ━━━${NC}"
echo ""

# Check git
command -v git &>/dev/null || { echo -e "${RED}Git not found. Install from https://git-scm.com${NC}"; exit 1; }

cd "$(dirname "$0")"

# Init if needed
if [ ! -d ".git" ]; then
  git init
  echo -e "${GREEN}✔ Git repo initialized${NC}"
fi

# Get remote URL
REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
if [ -z "$REMOTE" ]; then
  echo -e "${YELLOW}Enter your GitHub repository URL:${NC}"
  echo "  e.g. https://github.com/yourusername/nexcollab.git"
  read -p "URL: " REPO_URL
  git remote add origin "$REPO_URL"
  echo -e "${GREEN}✔ Remote added${NC}"
fi

# Stage and commit
git add .
echo -e "${YELLOW}Enter commit message (press Enter for default):${NC}"
read -p "Message: " COMMIT_MSG
COMMIT_MSG="${COMMIT_MSG:-NexCollab v2.0 – Full collaborative workspace with AI}"

git commit -m "$COMMIT_MSG" --allow-empty

# Push
echo ""
echo -e "${BLUE}Pushing to GitHub...${NC}"
git branch -M main
git push -u origin main

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Successfully pushed to GitHub!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
