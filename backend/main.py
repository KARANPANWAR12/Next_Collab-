from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import json, os

from database import engine, get_db, Base
from models import user as user_model, workspace as ws_model, document as doc_model
from models import message as msg_model, file as file_model, notification as notif_model
from routers import auth, workspaces, documents, messages, ai_assistant, files, notifications, search
from core.config import settings
from core.websocket_manager import ConnectionManager

Base.metadata.create_all(bind=engine)

os.makedirs("uploads", exist_ok=True)

app = FastAPI(
    title="NexCollab API",
    description="Real-time collaborative workspace with AI assistance",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

manager = ConnectionManager()

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(workspaces.router, prefix="/api/workspaces", tags=["Workspaces"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])
app.include_router(ai_assistant.router, prefix="/api/ai", tags=["AI Assistant"])
app.include_router(files.router, prefix="/api/files", tags=["Files"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])


@app.get("/")
def root():
    return {"message": "NexCollab API v2.0 running", "docs": "/docs"}


@app.get("/api/health")
def health():
    return {"status": "healthy", "version": "2.0.0"}


@app.websocket("/ws/{workspace_id}/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    workspace_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    await manager.connect(websocket, workspace_id, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            event_type = message.get("type")

            if event_type == "chat_message":
                from models.message import Message
                from models.user import User
                msg = Message(
                    content=message.get("content"),
                    workspace_id=workspace_id,
                    sender_id=user_id
                )
                db.add(msg)
                db.commit()
                db.refresh(msg)
                user = db.query(User).filter(User.id == user_id).first()
                await manager.broadcast_to_workspace(
                    workspace_id,
                    {
                        "type": "chat_message",
                        "id": msg.id,
                        "user_id": user_id,
                        "username": user.username if user else "Unknown",
                        "full_name": user.full_name if user else "Unknown",
                        "avatar_color": user.avatar_color if user else "#6366f1",
                        "content": message.get("content"),
                        "timestamp": msg.created_at.isoformat()
                    }
                )

            elif event_type == "typing":
                await manager.broadcast_to_workspace(
                    workspace_id,
                    {
                        "type": "typing",
                        "user_id": user_id,
                        "username": message.get("username"),
                        "is_typing": message.get("is_typing", True)
                    },
                    exclude_user=user_id
                )

            elif event_type == "document_update":
                await manager.broadcast_to_workspace(
                    workspace_id,
                    {
                        "type": "document_update",
                        "document_id": message.get("document_id"),
                        "content": message.get("content"),
                        "title": message.get("title"),
                        "user_id": user_id,
                        "username": message.get("username"),
                    },
                    exclude_user=user_id
                )

            elif event_type == "cursor_move":
                await manager.broadcast_to_workspace(
                    workspace_id,
                    {
                        "type": "cursor_move",
                        "user_id": user_id,
                        "username": message.get("username"),
                        "document_id": message.get("document_id"),
                        "position": message.get("position")
                    },
                    exclude_user=user_id
                )

            elif event_type == "presence":
                await manager.broadcast_to_workspace(
                    workspace_id,
                    {
                        "type": "presence",
                        "user_id": user_id,
                        "username": message.get("username"),
                        "status": message.get("status", "online")
                    },
                    exclude_user=user_id
                )

    except WebSocketDisconnect:
        manager.disconnect(websocket, workspace_id, user_id)
        await manager.broadcast_to_workspace(
            workspace_id,
            {"type": "user_left", "user_id": user_id}
        )
