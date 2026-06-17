# NexCollab v2.0 🚀

**A production-ready, real-time collaborative workspace platform with AI assistance.**

![NexCollab](https://img.shields.io/badge/NexCollab-v2.0-6366f1?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql)
![WebSocket](https://img.shields.io/badge/WebSocket-Live-emerald?style=for-the-badge)

---

## ✨ Features

### Phase 1 – Core (✅ Done)
- **JWT Authentication** – Signup, Login, Protected routes
- **Dashboard** – Workspace statistics, workspace cards
- **Deployment Ready** – Vercel + Render + PostgreSQL

### Phase 2 – Workspace Collaboration (✅ Done)
- **Invite System** – Copy invite code, one-click join via code
- **Member Management** – View all members, avatars, join dates
- **Role System** – Owner, Admin, Editor, Viewer, Member
- **Remove Members** – Owner/Admin can remove members
- **Activity Feed** – Real-time workspace activity log
- **Regenerate Invite Code** – Invalidate old codes

### Phase 3 & 4 – Real-Time Chat + WebSockets (✅ Done)
- **Live Chat** – WebSocket-powered real-time messaging
- **Typing Indicators** – See who's typing in real time
- **Online/Offline Status** – Green dot presence tracking
- **Unread Message Counter** – Badge on Chat tab
- **Auto-reconnect** – WebSocket reconnects automatically
- **Fallback to REST** – Sends via API if WebSocket drops

### Phase 5 – Collaborative Documents (✅ Done)
- **Rich Text Editor** – Bold, Italic, Underline, Headings, Lists, Code blocks
- **Real-Time Sync** – Document edits broadcast via WebSocket
- **Auto-Save** – Saves 2 seconds after you stop typing (Ctrl+S also works)
- **Version History** – Every save creates a version, restore any version
- **Multi-Document** – Create and manage multiple docs per workspace

### Phase 6 – File Management (✅ Done)
- **File Upload** – Drag & drop or click to upload (PDF, Images, DOCX, PPTX, XLSX, ZIP, TXT)
- **File Preview** – In-browser preview for images and PDFs
- **Download Files** – Direct download links
- **Delete Files** – Uploader or Admin can delete
- **10MB Limit** – Per-file size limit enforced

### Phase 7 – AI Features (✅ Done)
- **AI Chat Assistant** – Ask anything about your workspace
- **Document Summarization** – Condense long documents instantly
- **Action Points Extraction** – Extract tasks and next steps
- **Meeting Notes** – Convert content to structured meeting notes
- **Demo Mode** – Works without OpenAI key (mock responses)
- **Real AI** – Add `OPENAI_API_KEY` to `.env` for GPT-4o-mini

### Phase 8 – Notifications (✅ Done)
- **Notification Bell** – Badge with unread count
- **Notification Types** – Messages, documents, member joined, invitations
- **Mark as Read** – Individual or mark all read
- **Auto-refresh** – Polls every 30 seconds

### Phase 9 – Roles & Permissions (✅ Done)
- **Owner** – Full control, can delete workspace
- **Admin** – Manage members, change roles, regenerate invite
- **Editor** – Create and edit documents
- **Viewer** – Read-only access
- **Member** – Default role, can chat and view

### Phase 10 – Professional Features (✅ Done)
- **Global Search** – Search workspaces, documents, and messages
- **Analytics Dashboard** – Total workspaces, docs, messages, members
- **Profile Settings** – Edit name, bio, avatar color
- **Change Password** – Secure password update
- **Invite Code Regeneration** – Invalidate old codes

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router |
| **Backend** | FastAPI (Python), SQLAlchemy ORM |
| **Database** | PostgreSQL |
| **Real-time** | WebSockets (native FastAPI) |
| **Auth** | JWT (python-jose + passlib bcrypt) |
| **AI** | OpenAI GPT-4o-mini (optional) |
| **File Storage** | Local filesystem (configurable) |
| **Icons** | Lucide React |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 13+

### 1. Run Setup (first time only)

**macOS / Linux:**
```bash
chmod +x setup.sh start_backend.sh start_frontend.sh push_to_github.sh
./setup.sh
```

**Windows:**
```cmd
setup.bat
```

### 2. Start Backend (Terminal 1)

```bash
# macOS/Linux
./start_backend.sh

# Windows
start_backend.bat
```
Backend runs at → **http://127.0.0.1:8000**  
API Docs → **http://127.0.0.1:8000/docs**

### 3. Start Frontend (Terminal 2)

```bash
# macOS/Linux
./start_frontend.sh

# Windows
start_frontend.bat
```
App runs at → **http://localhost:5173**

---

## ⚙️ Configuration

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/nexcollab
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
OPENAI_API_KEY=           # Optional: Add for real AI responses
DEBUG=True
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://127.0.0.1:8000
VITE_WS_URL=ws://127.0.0.1:8000
```

---

## 📦 Push to GitHub

```bash
# macOS/Linux
./push_to_github.sh

# Windows
git init
git add .
git commit -m "NexCollab v2.0"
git remote add origin https://github.com/yourusername/nexcollab.git
git push -u origin main
```

---

## 🗂 Project Structure

```
NexCollab/
├── backend/
│   ├── core/
│   │   ├── config.py          # App settings
│   │   ├── security.py        # JWT + password hashing
│   │   └── websocket_manager.py  # WS connection pool
│   ├── models/
│   │   ├── user.py            # User model
│   │   ├── workspace.py       # Workspace + Member models
│   │   ├── document.py        # Document + Version models
│   │   ├── message.py         # Message + ActivityLog models
│   │   ├── file.py            # FileUpload model
│   │   └── notification.py    # Notification model
│   ├── routers/
│   │   ├── auth.py            # Auth + profile endpoints
│   │   ├── workspaces.py      # Workspace CRUD + member management
│   │   ├── documents.py       # Document CRUD + version history
│   │   ├── messages.py        # Chat message endpoints
│   │   ├── files.py           # File upload/download/delete
│   │   ├── notifications.py   # Notification CRUD
│   │   ├── ai_assistant.py    # AI summarize + chat
│   │   └── search.py          # Global search + analytics
│   ├── schemas/__init__.py    # All Pydantic schemas
│   ├── database.py            # SQLAlchemy engine + session
│   ├── main.py                # App entry + WebSocket endpoint
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Top nav with notifications
│   │   │   ├── Sidebar.jsx         # Side navigation
│   │   │   ├── WorkspaceCard.jsx   # Workspace card with invite copy
│   │   │   ├── ChatPanel.jsx       # Real-time WebSocket chat
│   │   │   ├── DocumentEditor.jsx  # Rich text editor + real-time sync
│   │   │   ├── MemberList.jsx      # Members with roles + remove
│   │   │   ├── ActivityFeed.jsx    # Workspace activity timeline
│   │   │   ├── FileManager.jsx     # File upload + preview
│   │   │   ├── AIPanel.jsx         # AI chat + document analysis
│   │   │   ├── JoinWorkspaceModal.jsx  # Join via invite code
│   │   │   ├── CreateWorkspaceModal.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx  # Home with analytics + search
│   │   │   ├── Workspace.jsx  # 6-tab workspace view
│   │   │   ├── Profile.jsx    # Profile + password settings
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   ├── services/
│   │   │   ├── api.js         # Axios with JWT interceptor
│   │   │   └── websocket.js   # WS connect/send/listen/reconnect
│   │   └── context/
│   │       └── AuthContext.jsx
│   ├── package.json
│   └── .env
├── setup.sh / setup.bat
├── start_backend.sh / start_backend.bat
├── start_frontend.sh / start_frontend.bat
├── push_to_github.sh
├── .gitignore
└── README.md
```

---

## 🌐 Deployment

### Backend → Render.com
1. Push to GitHub
2. Create new **Web Service** on Render
3. Connect your repo, set **Root Directory** to `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables from `.env`

### Frontend → Vercel
1. Import GitHub repo in Vercel
2. Set **Root Directory** to `frontend`
3. Add environment variables:
   - `VITE_API_URL` → your Render backend URL
   - `VITE_WS_URL` → `wss://your-backend.onrender.com`

---

## 🤖 Enable Real AI

1. Get an API key from [platform.openai.com](https://platform.openai.com)
2. Add to `backend/.env`:
   ```env
   OPENAI_API_KEY=sk-...your-key...
   ```
3. Restart the backend

---

Built with ❤️ using FastAPI + React + PostgreSQL + WebSockets
