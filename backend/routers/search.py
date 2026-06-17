from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.user import User
from models.workspace import Workspace, WorkspaceMember
from models.document import Document
from models.message import Message
from core.security import get_current_user

router = APIRouter()


@router.get("/")
def global_search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get user's workspaces
    memberships = db.query(WorkspaceMember).filter(
        WorkspaceMember.user_id == current_user.id
    ).all()
    workspace_ids = [m.workspace_id for m in memberships]

    results = []

    # Search workspaces
    workspaces = db.query(Workspace).filter(
        Workspace.id.in_(workspace_ids),
        Workspace.name.ilike(f"%{q}%")
    ).limit(5).all()
    for ws in workspaces:
        results.append({
            "type": "workspace",
            "id": ws.id,
            "title": ws.name,
            "description": ws.description,
            "workspace_id": ws.id,
            "created_at": ws.created_at.isoformat()
        })

    # Search documents
    docs = db.query(Document).filter(
        Document.workspace_id.in_(workspace_ids),
        Document.is_deleted == False,
        (Document.title.ilike(f"%{q}%") | Document.content.ilike(f"%{q}%"))
    ).limit(5).all()
    for doc in docs:
        results.append({
            "type": "document",
            "id": doc.id,
            "title": doc.title,
            "description": doc.content[:100] + "..." if len(doc.content) > 100 else doc.content,
            "workspace_id": doc.workspace_id,
            "created_at": doc.created_at.isoformat()
        })

    # Search messages
    msgs = db.query(Message).filter(
        Message.workspace_id.in_(workspace_ids),
        Message.content.ilike(f"%{q}%")
    ).limit(5).all()
    for msg in msgs:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        results.append({
            "type": "message",
            "id": msg.id,
            "title": f"Message by {sender.username if sender else 'Unknown'}",
            "description": msg.content[:100],
            "workspace_id": msg.workspace_id,
            "created_at": msg.created_at.isoformat()
        })

    return {"query": q, "results": results, "total": len(results)}


@router.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    memberships = db.query(WorkspaceMember).filter(
        WorkspaceMember.user_id == current_user.id
    ).all()
    workspace_ids = [m.workspace_id for m in memberships]

    total_workspaces = len(workspace_ids)
    total_docs = db.query(Document).filter(
        Document.workspace_id.in_(workspace_ids),
        Document.is_deleted == False
    ).count()
    total_messages = db.query(Message).filter(
        Message.workspace_id.in_(workspace_ids)
    ).count()
    total_members = sum(
        db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == wid).count()
        for wid in workspace_ids
    )

    # Per-workspace stats
    workspace_stats = []
    for wid in workspace_ids:
        ws = db.query(Workspace).filter(Workspace.id == wid).first()
        if ws:
            workspace_stats.append({
                "id": wid,
                "name": ws.name,
                "docs": db.query(Document).filter(Document.workspace_id == wid, Document.is_deleted == False).count(),
                "messages": db.query(Message).filter(Message.workspace_id == wid).count(),
                "members": db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == wid).count()
            })

    return {
        "totals": {
            "workspaces": total_workspaces,
            "documents": total_docs,
            "messages": total_messages,
            "members": total_members
        },
        "workspaces": workspace_stats
    }
