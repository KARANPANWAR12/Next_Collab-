from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.user import User
from models.workspace import Workspace, WorkspaceMember
from models.message import ActivityLog
from models.notification import Notification
from schemas import WorkspaceCreate, WorkspaceOut, JoinWorkspace, WorkspaceUpdate, MemberRoleUpdate
from core.security import get_current_user
import secrets, string

router = APIRouter()


def generate_invite_code(length=8):
    chars = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))


def log_activity(db, workspace_id, user_id, action, entity_type=None, entity_id=None, entity_name=None):
    log = ActivityLog(
        workspace_id=workspace_id,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        entity_name=entity_name
    )
    db.add(log)
    db.commit()


def get_member_role(db, workspace_id, user_id):
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()
    return member.role if member else None


@router.post("/", response_model=WorkspaceOut, status_code=201)
def create_workspace(
    data: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ws = Workspace(
        name=data.name,
        description=data.description,
        invite_code=generate_invite_code(),
        owner_id=current_user.id,
        is_public=data.is_public
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)
    member = WorkspaceMember(workspace_id=ws.id, user_id=current_user.id, role="owner")
    db.add(member)
    db.commit()
    log_activity(db, ws.id, current_user.id, "created_workspace", "workspace", ws.id, ws.name)
    ws.member_count = 1
    return ws


@router.get("/", response_model=List[WorkspaceOut])
def get_my_workspaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    memberships = db.query(WorkspaceMember).filter(
        WorkspaceMember.user_id == current_user.id
    ).all()
    workspaces = []
    for m in memberships:
        ws = db.query(Workspace).filter(Workspace.id == m.workspace_id).first()
        if ws:
            ws.member_count = db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == ws.id
            ).count()
            workspaces.append(ws)
    return workspaces


@router.get("/{workspace_id}", response_model=WorkspaceOut)
def get_workspace(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Access denied")
    ws.member_count = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id
    ).count()
    return ws


@router.patch("/{workspace_id}", response_model=WorkspaceOut)
def update_workspace(
    workspace_id: int,
    data: WorkspaceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    role = get_member_role(db, workspace_id, current_user.id)
    if role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only owner/admin can update workspace")
    if data.name:
        ws.name = data.name
    if data.description is not None:
        ws.description = data.description
    db.commit()
    db.refresh(ws)
    ws.member_count = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == ws.id).count()
    return ws


@router.post("/join", response_model=WorkspaceOut)
def join_workspace(
    data: JoinWorkspace,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ws = db.query(Workspace).filter(Workspace.invite_code == data.invite_code).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    existing = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == ws.id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already a member")
    member = WorkspaceMember(workspace_id=ws.id, user_id=current_user.id, role="member")
    db.add(member)
    db.commit()

    # Notify workspace owner
    notif = Notification(
        user_id=ws.owner_id,
        workspace_id=ws.id,
        type="member_joined",
        title="New Member Joined",
        body=f"{current_user.full_name} joined your workspace '{ws.name}'"
    )
    db.add(notif)

    log_activity(db, ws.id, current_user.id, "joined_workspace", "workspace", ws.id, ws.name)
    ws.member_count = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == ws.id).count()
    return ws


@router.post("/{workspace_id}/regenerate-invite")
def regenerate_invite(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    role = get_member_role(db, workspace_id, current_user.id)
    if role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    ws.invite_code = generate_invite_code()
    db.commit()
    return {"invite_code": ws.invite_code}


@router.get("/{workspace_id}/members")
def get_members(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member_check = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member_check:
        raise HTTPException(status_code=403, detail="Access denied")
    members = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id
    ).all()
    result = []
    for m in members:
        user = db.query(User).filter(User.id == m.user_id).first()
        if user:
            result.append({
                "user_id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "email": user.email,
                "avatar_color": user.avatar_color,
                "role": m.role,
                "joined_at": m.joined_at.isoformat()
            })
    return result


@router.patch("/{workspace_id}/members/{user_id}/role")
def update_member_role(
    workspace_id: int,
    user_id: int,
    data: MemberRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    my_role = get_member_role(db, workspace_id, current_user.id)
    if my_role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only owner/admin can change roles")
    target_member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()
    if not target_member:
        raise HTTPException(status_code=404, detail="Member not found")
    if target_member.role == "owner":
        raise HTTPException(status_code=403, detail="Cannot change owner role")
    if data.role not in ["admin", "editor", "viewer", "member"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    target_member.role = data.role
    db.commit()
    return {"message": "Role updated"}


@router.delete("/{workspace_id}/members/{user_id}")
def remove_member(
    workspace_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    my_role = get_member_role(db, workspace_id, current_user.id)
    if my_role not in ["owner", "admin"] and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    target = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")
    if target.role == "owner":
        raise HTTPException(status_code=403, detail="Cannot remove workspace owner")
    db.delete(target)
    db.commit()
    log_activity(db, workspace_id, current_user.id, "removed_member", "user", user_id)
    return {"message": "Member removed"}


@router.delete("/{workspace_id}")
def delete_workspace(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if ws.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can delete workspace")
    db.delete(ws)
    db.commit()
    return {"message": "Workspace deleted"}


@router.get("/{workspace_id}/activity")
def get_activity(
    workspace_id: int,
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member_check = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not member_check:
        raise HTTPException(status_code=403, detail="Access denied")
    logs = db.query(ActivityLog).filter(
        ActivityLog.workspace_id == workspace_id
    ).order_by(ActivityLog.created_at.desc()).limit(limit).all()
    result = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first()
        result.append({
            "id": log.id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_name": log.entity_name,
            "entity_id": log.entity_id,
            "created_at": log.created_at.isoformat(),
            "user": {
                "id": user.id if user else 0,
                "username": user.username if user else "Unknown",
                "full_name": user.full_name if user else "Unknown",
                "avatar_color": user.avatar_color if user else "#6366f1"
            }
        })
    return result


@router.get("/{workspace_id}/online-users")
def get_online_users(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from main import manager
    online = manager.get_online_users(workspace_id)
    return {"online_users": online}
