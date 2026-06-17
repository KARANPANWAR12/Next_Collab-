from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.user import User
from models.document import Document, DocumentVersion
from models.workspace import WorkspaceMember
from models.message import ActivityLog
from schemas import DocumentCreate, DocumentUpdate, DocumentOut, DocumentVersionOut
from core.security import get_current_user

router = APIRouter()


def check_workspace_access(db, workspace_id, user_id):
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Access denied")
    return member


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


@router.post("/{workspace_id}", response_model=DocumentOut, status_code=201)
def create_document(
    workspace_id: int,
    data: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_workspace_access(db, workspace_id, current_user.id)
    doc = Document(
        title=data.title,
        content=data.content or "",
        doc_type=data.doc_type or "note",
        tags=data.tags or [],
        workspace_id=workspace_id,
        creator_id=current_user.id,
        last_edited_by=current_user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    log_activity(db, workspace_id, current_user.id, "created_document", "document", doc.id, doc.title)
    doc.creator = current_user
    return doc


@router.get("/{workspace_id}", response_model=List[DocumentOut])
def get_documents(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_workspace_access(db, workspace_id, current_user.id)
    docs = db.query(Document).filter(
        Document.workspace_id == workspace_id,
        Document.is_deleted == False
    ).order_by(Document.updated_at.desc()).all()
    for doc in docs:
        doc.creator = db.query(User).filter(User.id == doc.creator_id).first()
    return docs


@router.get("/doc/{doc_id}", response_model=DocumentOut)
def get_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.is_deleted == False).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    check_workspace_access(db, doc.workspace_id, current_user.id)
    doc.creator = db.query(User).filter(User.id == doc.creator_id).first()
    return doc


@router.patch("/doc/{doc_id}", response_model=DocumentOut)
def update_document(
    doc_id: int,
    data: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.is_deleted == False).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    member = check_workspace_access(db, doc.workspace_id, current_user.id)
    if member.role == "viewer":
        raise HTTPException(status_code=403, detail="Viewers cannot edit documents")

    # Save version before update
    version = DocumentVersion(
        document_id=doc.id,
        title=doc.title,
        content=doc.content,
        version_number=doc.version,
        editor_id=current_user.id
    )
    db.add(version)

    if data.title is not None:
        doc.title = data.title
    if data.content is not None:
        doc.content = data.content
    if data.tags is not None:
        doc.tags = data.tags
    doc.last_edited_by = current_user.id
    doc.version += 1
    db.commit()
    db.refresh(doc)
    log_activity(db, doc.workspace_id, current_user.id, "edited_document", "document", doc.id, doc.title)
    doc.creator = db.query(User).filter(User.id == doc.creator_id).first()
    return doc


@router.get("/doc/{doc_id}/versions")
def get_versions(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    check_workspace_access(db, doc.workspace_id, current_user.id)
    versions = db.query(DocumentVersion).filter(
        DocumentVersion.document_id == doc_id
    ).order_by(DocumentVersion.id.desc()).all()
    result = []
    for v in versions:
        editor = db.query(User).filter(User.id == v.editor_id).first()
        result.append({
            "id": v.id,
            "version_number": v.version_number,
            "title": v.title,
            "content": v.content,
            "editor": {"username": editor.username, "full_name": editor.full_name} if editor else None,
            "created_at": v.created_at.isoformat()
        })
    return result


@router.post("/doc/{doc_id}/restore/{version_id}", response_model=DocumentOut)
def restore_version(
    doc_id: int,
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    check_workspace_access(db, doc.workspace_id, current_user.id)
    version = db.query(DocumentVersion).filter(DocumentVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    # Save current as version first
    cur_version = DocumentVersion(
        document_id=doc.id,
        title=doc.title,
        content=doc.content,
        version_number=doc.version,
        editor_id=current_user.id
    )
    db.add(cur_version)
    doc.title = version.title
    doc.content = version.content
    doc.last_edited_by = current_user.id
    doc.version += 1
    db.commit()
    db.refresh(doc)
    doc.creator = db.query(User).filter(User.id == doc.creator_id).first()
    return doc


@router.delete("/doc/{doc_id}")
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    member = check_workspace_access(db, doc.workspace_id, current_user.id)
    if doc.creator_id != current_user.id and member.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete")
    doc.is_deleted = True
    db.commit()
    log_activity(db, doc.workspace_id, current_user.id, "deleted_document", "document", doc.id, doc.title)
    return {"message": "Document deleted"}
