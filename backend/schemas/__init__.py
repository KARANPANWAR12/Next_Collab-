from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ─── User Schemas ───────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_color: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class UserOut(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    avatar_color: str
    bio: Optional[str] = ""
    created_at: datetime
    last_seen: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ─── Workspace Schemas ──────────────────────────────────────────────────────

class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class WorkspaceOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    invite_code: str
    owner_id: int
    is_public: bool
    created_at: datetime
    member_count: Optional[int] = 0

    class Config:
        from_attributes = True

class JoinWorkspace(BaseModel):
    invite_code: str

class MemberRoleUpdate(BaseModel):
    role: str  # admin, editor, viewer, member

class MemberOut(BaseModel):
    user_id: int
    username: str
    full_name: str
    email: str
    avatar_color: str
    role: str
    joined_at: str


# ─── Document Schemas ───────────────────────────────────────────────────────

class DocumentCreate(BaseModel):
    title: str
    content: Optional[str] = ""
    doc_type: Optional[str] = "note"
    tags: Optional[List[str]] = []

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None

class DocumentVersionOut(BaseModel):
    id: int
    document_id: int
    title: str
    content: str
    version_number: int
    editor_id: int
    created_at: datetime
    editor: Optional[UserOut] = None

    class Config:
        from_attributes = True

class DocumentOut(BaseModel):
    id: int
    title: str
    content: str
    workspace_id: int
    creator_id: int
    doc_type: str
    tags: List[str]
    version: int
    created_at: datetime
    updated_at: datetime
    creator: Optional[UserOut] = None

    class Config:
        from_attributes = True


# ─── Message Schemas ─────────────────────────────────────────────────────────

class MessageCreate(BaseModel):
    content: str

class MessageOut(BaseModel):
    id: int
    content: str
    workspace_id: int
    sender_id: int
    is_ai: bool
    created_at: datetime
    sender: Optional[UserOut] = None

    class Config:
        from_attributes = True


# ─── File Schemas ─────────────────────────────────────────────────────────────

class FileOut(BaseModel):
    id: int
    filename: str
    original_name: str
    file_type: str
    file_size: int
    file_path: str
    workspace_id: int
    uploader_id: int
    created_at: datetime
    uploader: Optional[UserOut] = None

    class Config:
        from_attributes = True


# ─── Notification Schemas ─────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: int
    user_id: int
    workspace_id: Optional[int]
    type: str
    title: str
    body: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── AI Schemas ──────────────────────────────────────────────────────────────

class SummarizeRequest(BaseModel):
    content: str
    doc_id: Optional[int] = None
    mode: Optional[str] = "summary"  # summary, action_points, meeting_notes


# ─── Search Schema ───────────────────────────────────────────────────────────

class SearchResult(BaseModel):
    type: str  # workspace, document, message
    id: int
    title: str
    description: Optional[str] = None
    workspace_id: Optional[int] = None
    created_at: Optional[datetime] = None
