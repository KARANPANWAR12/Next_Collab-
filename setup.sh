#!/bin/bash

# ─────────────────────────────────────────────────────────────────
#  NexCollab v2.0 – Full Setup Script
#  Run this once to set up the entire project
# ─────────────────────────────────────────────────────────────────

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()     { echo -e "${GREEN}[✔]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
error()   { echo -e "${RED}[✘]${NC} $1"; exit 1; }
section() { echo -e "\n${BLUE}━━━ $1 ━━━${NC}"; }

echo -e "${BLUE}"
echo "  ╔════════════════════════════════╗"
echo "  ║   NexCollab v2.0 Setup         ║"
echo "  ║   Collaborative Workspace AI   ║"
echo "  ╚════════════════════════════════╝"
echo -e "${NC}"

# ─── Prerequisites ───────────────────────────────────────────────
section "Checking Prerequisites"

command -v python3 &>/dev/null || error "Python 3 is required. Install from https://python.org"
command -v node    &>/dev/null || error "Node.js is required. Install from https://nodejs.org"
command -v psql    &>/dev/null || warn "PostgreSQL CLI not found. Make sure PostgreSQL is running."

log "Python: $(python3 --version)"
log "Node:   $(node --version)"
log "npm:    $(npm --version)"

# ─── Database ─────────────────────────────────────────────────────
section "Database Setup"

DB_NAME="nexcollab"
DB_USER="postgres"
DB_PASS="password"
DB_HOST="localhost"
DB_PORT="5432"

warn "Attempting to create database '${DB_NAME}'..."
warn "If prompted for a password, enter your PostgreSQL password (default: 'password')"

if command -v psql &>/dev/null; then
  psql -U "$DB_USER" -h "$DB_HOST" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null && log "Database '$DB_NAME' created" || warn "Database may already exist — skipping."
else
  warn "psql not found. Create the database manually:"
  warn "  CREATE DATABASE nexcollab;"
  warn "Then update backend/.env with your credentials."
fi

# Update .env with current credentials
ENV_FILE="backend/.env"
cat > "$ENV_FILE" << ENV
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}
SECRET_KEY=nexcollab-super-secret-key-$(openssl rand -hex 16 2>/dev/null || echo "change-me-in-production")
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
OPENAI_API_KEY=
DEBUG=True
ENV
log ".env configured"

# ─── Backend ──────────────────────────────────────────────────────
section "Backend Setup"

cd backend
python3 -m venv venv
log "Virtual environment created"

source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
pip install --upgrade pip -q
pip install -r requirements.txt -q
log "Python packages installed"

mkdir -p uploads
log "Uploads directory created"

cd ..

# ─── Frontend ─────────────────────────────────────────────────────
section "Frontend Setup"

cd frontend
npm install --legacy-peer-deps
log "Node packages installed"
cd ..

# ─── Done ──────────────────────────────────────────────────────────
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ NexCollab setup complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Next steps:"
echo "  1. Start backend:   ./start_backend.sh"
echo "  2. Start frontend:  ./start_frontend.sh  (in a new terminal)"
echo "  3. Open browser:    http://localhost:5173"
echo ""
echo "  Optional:"
echo "  - Add OPENAI_API_KEY to backend/.env for real AI responses"
echo "  - Update DATABASE_URL in backend/.env if needed"
echo ""
