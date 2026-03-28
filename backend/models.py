import uuid
from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    file_content = Column(Text, nullable=False)  # base64
    status = Column(String, default="queued") # 'queued' | 'processing' | 'completed' | 'failed'
    progress = Column(Integer, default=0)
    current_stage = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    result = relationship("JobResult", back_populates="document", uselist=False, cascade="all, delete-orphan")

class JobResult(Base):
    __tablename__ = "job_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id"), unique=True)
    title = Column(String, nullable=True)
    category = Column(String, nullable=True)
    summary = Column(Text, nullable=True)
    keywords = Column(JSON, nullable=True)
    extracted_metadata = Column(JSON, nullable=True)
    is_finalized = Column(Boolean, default=False)
    raw_output = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    document = relationship("Document", back_populates="result")
