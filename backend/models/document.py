from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, default="")
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    last_edited_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    version = Column(Integer, default=1)
    doc_type = Column(String, default="note")  # note, doc, meeting
    tags = Column(JSON, default=list)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    workspace = relationship("Workspace", back_populates="documents")
    creator = relationship("User", back_populates="documents", foreign_keys=[creator_id])
    editor = relationship("User", foreign_keys=[last_edited_by])
    versions = relationship("DocumentVersion", back_populates="document", order_by="DocumentVersion.id.desc()")


class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, default="")
    version_number = Column(Integer, nullable=False)
    editor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates="versions")
    editor = relationship("User", foreign_keys=[editor_id])
