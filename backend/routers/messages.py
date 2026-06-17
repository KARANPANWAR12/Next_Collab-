from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.user import User
from models.message import Message
from models.workspace import WorkspaceMember
from schemas import MessageCreate, MessageOut
from core.security import get_current_user

router = APIRouter()


@router.post("/{workspace_id}", response_model=MessageOut, status_code=201)
def send_message(
    workspace_id: int,
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Access denied")
    msg = Message(content=data.content, workspace_id=workspace_id, sender_id=current_user.id)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    msg.sender = current_user
    return msg


@router.get("/{workspace_id}", response_model=List[MessageOut])
def get_messages(
    workspace_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Access denied")
    messages = db.query(Message).filter(
        Message.workspace_id == workspace_id
    ).order_by(Message.created_at.asc()).offset(offset).limit(limit).all()
    for msg in messages:
        msg.sender = db.query(User).filter(User.id == msg.sender_id).first()
    return messages


@router.delete("/{workspace_id}/{message_id}")
def delete_message(
    workspace_id: int,
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    msg = db.query(Message).filter(Message.id == message_id, Message.workspace_id == workspace_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if msg.sender_id != current_user.id and (not member or member.role not in ["owner", "admin"]):
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(msg)
    db.commit()
    return {"message": "Message deleted"}
