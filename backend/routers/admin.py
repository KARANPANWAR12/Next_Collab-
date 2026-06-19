from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from models.user import User
from core.security import get_password_hash, get_current_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# ─── Response Models ──────────────────────────────────────────────────────
class UserPublic(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    is_active: bool
    created_at: datetime

class PasswordResetRequest(BaseModel):
    new_password: str

# ─── Admin Dependency (checks `is_admin` column) ──────────────────────────
def get_admin_user(current_user: User = Depends(get_current_user)):
    if not hasattr(current_user, "is_admin") or not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

# ─── Endpoints ──────────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserPublic])
def get_all_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """List all registered users (excludes password hash)."""
    users = db.query(User).all()
    return users

@router.post("/reset-password/{user_id}")
def reset_password(
    user_id: int,
    req: PasswordResetRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Force‑reset a user's password to a new value."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return {"message": f"Password for {user.email} has been reset successfully."}

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Delete a user account (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": f"User {user.email} has been deleted."}