# NexCollab 🚀

### AI-Powered Real-Time Collaborative Workspace Platform

<p align="center">
  <img src="https://img.shields.io/badge/React-18-blue?logo=react" />
  <img src="https://img.shields.io/badge/FastAPI-0.111-green?logo=fastapi" />
  <img src="https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql" />
  <img src="https://img.shields.io/badge/WebSockets-RealTime-orange" />
  <img src="https://img.shields.io/badge/Status-Production%20Ready-success" />
  <img src="https://img.shields.io/badge/Version-v2.0.1-purple" />
</p>

<p align="center">
  <b>A production-ready collaborative workspace platform inspired by Slack, Notion, and Microsoft Teams, featuring real-time communication, collaborative document editing, file sharing, notifications, and AI-powered productivity tools.</b>
</p>

<p align="center">
  <a href="https://next-collab-omega.vercel.app">🌐 Live Demo</a> •
  <a href="https://nexcollab-backend.onrender.com/docs">📖 API Docs</a> •
  <a href="https://github.com/KARANPANWAR12/Next_Collab-">🐙 GitHub Repository</a>
</p>

---

# 📖 About The Project

NexCollab is a full-stack collaborative workspace platform built to enable teams and organizations to communicate, collaborate, and manage projects efficiently in real time.

The platform combines:

* Secure JWT Authentication
* Workspace & Member Management
* Real-Time Chat using WebSockets
* Collaborative Document Editing
* File Management System
* AI-Powered Workspace Assistant
* Notifications & Analytics
* Role-Based Access Control (RBAC)
* Production Deployment using Render, Vercel, and Neon

This project demonstrates modern full-stack development concepts including REST APIs, real-time systems, authentication, database design, and scalable architecture.

---

# ✨ Features

## 🔐 Authentication & Security

* JWT Authentication
* Secure Password Hashing (bcrypt)
* Signup & Login System
* Protected Routes
* Session Persistence
* Change Password
* Case-Insensitive Login
* Automatic Token Management

---

## 🏢 Workspace Management

* Create Unlimited Workspaces
* Edit Workspace Details
* Delete Workspaces
* Invite Members via Invite Code
* Join Using Invite Code
* Regenerate Invite Codes
* Workspace Analytics
* Real-Time Activity Feed

---

## 👥 Role-Based Access Control (RBAC)

| Role      | Permissions                    |
| --------- | ------------------------------ |
| 👑 Owner  | Full Control, Delete Workspace |
| ⚙️ Admin  | Manage Members & Roles         |
| ✏️ Editor | Create and Edit Documents      |
| 👀 Viewer | Read-Only Access               |
| 👤 Member | Chat and View Content          |

---

## 💬 Real-Time Communication

* WebSocket-Based Chat
* Typing Indicators
* Online/Offline Presence
* Unread Message Counter
* Automatic Reconnection
* REST API Fallback
* Real-Time Message Broadcasting

---

## 📄 Collaborative Documents

* Rich Text Editor
* Headings, Lists, Code Blocks
* Real-Time Synchronization
* Auto Save
* Manual Save (Ctrl + S)
* Version History
* Restore Previous Versions
* Multi-Document Support

---

## 📁 File Management

* Drag & Drop Upload
* PDF Preview
* Image Preview
* Download Files
* Delete Files
* 10 MB Upload Limit
* Supported Formats:

  * PDF
  * PNG/JPG/GIF/SVG
  * DOCX
  * PPTX
  * XLSX
  * ZIP
  * TXT

---

## 🤖 AI Features

* AI Workspace Assistant
* Document Summarization
* Meeting Notes Generator
* Action Points Extraction
* Workspace Q&A
* Demo Mode without API Key
* GPT-4o-mini Integration

---

## 🔔 Notifications

* Notification Bell
* Unread Count Badge
* Mark as Read
* Mark All as Read
* Messages Notifications
* Document Notifications
* Member Join Notifications

---

## 📊 Search & Analytics

* Global Search
* Workspace Analytics
* Document Analytics
* Message Analytics
* Member Statistics
* Dashboard Insights

---

## 👤 Profile Management

* Edit Profile
* Change Name
* Bio Management
* Avatar Color Customization
* Change Password

---

## 🛠️ Tech Stack

### Frontend

* React 18
* Vite
* Tailwind CSS
* React Router DOM
* Axios
* React Hot Toast
* Lucide React

### Backend

* FastAPI
* Python 3.10
* SQLAlchemy ORM
* PostgreSQL
* WebSockets
* JWT Authentication
* Passlib + Bcrypt

### Deployment & Services

* Vercel
* Render
* Neon PostgreSQL
* GitHub

### AI

* OpenAI GPT-4o-mini

---

# 🏗️ System Architecture

```text
React Frontend
      │
      ▼
FastAPI Backend
      │
 ┌────┴─────┐
 │          │
 ▼          ▼
PostgreSQL  WebSockets
      │
      ▼
 OpenAI API
```

---

# 📂 Project Structure

```text
Next_Collab-
│
├── backend/
│   ├── core/
│   ├── models/
│   ├── routers/
│   ├── schemas/
│   ├── database.py
│   ├── main.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env
│
├── setup.sh
├── setup.bat
├── start_backend.sh
├── start_frontend.sh
├── README.md
└── .gitignore
```

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/KARANPANWAR12/Next_Collab-.git
cd Next_Collab-
```

---

## Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

API Documentation:

```text
http://127.0.0.1:8000/docs
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

# ⚙️ Environment Variables

## Backend (.env)

```env
DATABASE_URL=
SECRET_KEY=
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
OPENAI_API_KEY=
FRONTEND_URL=
DEBUG=True
```

## Frontend (.env)

```env
VITE_API_URL=
VITE_WS_URL=
```

---

# 🌐 Deployment

### Frontend

* Vercel

### Backend

* Render

### Database

* Neon PostgreSQL

Production Environment Variables:

```env
VITE_API_URL=https://nexcollab-backend.onrender.com
VITE_WS_URL=wss://nexcollab-backend.onrender.com
```

---

# 📸 Screenshots

Add screenshots inside:

```text
assets/
├── dashboard.png
├── workspace.png
├── chat.png
├── documents.png
├── files.png
└── ai.png
```

Then add:

```markdown
![Dashboard](assets/dashboard.png)
![Workspace](assets/workspace.png)
![Chat](assets/chat.png)
![AI Assistant](assets/ai.png)
```

---

# 📈 Resume Highlights

✔ Full Stack Development Project

✔ Real-Time Collaboration Platform

✔ WebSocket Architecture

✔ JWT Authentication & RBAC

✔ Rich Text Editor Implementation

✔ AI Integration using OpenAI API

✔ Production Deployment (Render + Vercel + Neon)

✔ Scalable Modular Architecture

✔ REST API & Database Design

---

# 🔮 Future Enhancements

* Video Conferencing
* Calendar Integration
* Email Notifications
* Google Drive Integration
* Mobile Application
* Dark Mode
* Task Management Board
* AI Workflow Automation

---

# 👨‍💻 Author

**Karan Panwar**

B.Tech Computer Science Engineering
Graphic Era Hill University, Dehradun, Uttarakhand, India

📧 Email: [karanpanwar2816@gmail.com](mailto:karanpanwar2816@gmail.com)

🐙 GitHub: https://github.com/KARANPANWAR12

---

# 📄 License

This project is licensed under the MIT License.

---

<p align="center">
Built with ❤️ by Karan Panwar
</p>
