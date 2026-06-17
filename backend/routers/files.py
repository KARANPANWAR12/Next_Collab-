from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import os, uuid, shutil
from database import get_db
from models.user import User
from models.file import FileUpload
from models.workspace import WorkspaceMember
from models.message import ActivityLog
from schemas import FileOut
from core.security import get_current_user
from core.config import settings

router = APIRouter()

ALLOWED_TYPES = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/zip": ".zip",
    "text/plain": ".txt",
    "text/csv": ".csv",
}


def check_access(db, workspace_id, user_id):
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Access denied")
    return member


@router.post("/{workspace_id}", response_model=FileOut, status_code=201)
async def upload_file(
    workspace_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_access(db, workspace_id, current_user.id)
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"File type not allowed: {file.content_type}")
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    ext = ALLOWED_TYPES.get(file.content_type, "")
    unique_name = f"{uuid.uuid4().hex}{ext}"
    ws_dir = os.path.join(settings.UPLOAD_DIR, str(workspace_id))
    os.makedirs(ws_dir, exist_ok=True)
    file_path = os.path.join(ws_dir, unique_name)
    with open(file_path, "wb") as f:
        f.write(content)
    db_file = FileUpload(
        filename=unique_name,
        original_name=file.filename,
        file_type=file.content_type,
        file_size=len(content),
        file_path=f"/uploads/{workspace_id}/{unique_name}",
        workspace_id=workspace_id,
        uploader_id=current_user.id
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    log = ActivityLog(workspace_id=workspace_id, user_id=current_user.id,
                      action="uploaded_file", entity_type="file", entity_id=db_file.id,
                      entity_name=file.filename)
    db.add(log)
    db.commit()
    db_file.uploader = current_user
    return db_file


@router.get("/{workspace_id}", response_model=List[FileOut])
def get_files(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_access(db, workspace_id, current_user.id)
    files = db.query(FileUpload).filter(
        FileUpload.workspace_id == workspace_id
    ).order_by(FileUpload.created_at.desc()).all()
    for f in files:
        f.uploader = db.query(User).filter(User.id == f.uploader_id).first()
    return files


@router.delete("/{workspace_id}/{file_id}")
def delete_file(
    workspace_id: int,
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = check_access(db, workspace_id, current_user.id)
    db_file = db.query(FileUpload).filter(
        FileUpload.id == file_id,
        FileUpload.workspace_id == workspace_id
    ).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    if db_file.uploader_id != current_user.id and member.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    disk_path = os.path.join(settings.UPLOAD_DIR, str(workspace_id), db_file.filename)
    if os.path.exists(disk_path):
        os.remove(disk_path)
    db.delete(db_file)
    db.commit()
    return {"message": "File deleted"}
