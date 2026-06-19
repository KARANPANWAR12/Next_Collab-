from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas import UserCreate, UserOut, Token, UserUpdate, PasswordChange
from core.security import get_password_hash, verify_password, create_access_token, get_current_user
import random

router = APIRouter()

AVATAR_COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f97316",
    "#10b981", "#0ea5e9", "#f59e0b", "#ef4444"
]

@router.post("/signup", response_model=Token, status_code=201)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    # Normalize email to lowercase
    email_lower = user_data.email.lower()
    
    if db.query(User).filter(User.email == email_lower).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=email_lower,  # stored in lowercase
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        avatar_color=random.choice(AVATAR_COLORS)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/login", response_model=Token)
def login(credentials: dict, db: Session = Depends(get_db)):
    # Convert email to lowercase for case‑insensitive lookup
    email = credentials.get("email", "").strip().lower()
    password = credentials.get("password")
    
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/profile", response_model=UserOut)
async def update_profile(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.bio is not None:
        current_user.bio = data.bio
    if data.avatar_color is not None:
        current_user.avatar_color = data.avatar_color
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/change-password")
async def change_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}

@router.get("/users", response_model=list[UserOut])
async def search_users(
    q: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not q:
        return []
    users = db.query(User).filter(
        (User.username.ilike(f"%{q}%")) | (User.email.ilike(f"%{q}%"))
    ).limit(10).all()
    return users