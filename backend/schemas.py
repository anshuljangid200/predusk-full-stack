from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any, Dict
from datetime import datetime

class DocumentCreate(BaseModel):
    filename: str
    file_type: str
    file_size: int
    file_content: str # base64

class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    status: str
    progress: int
    current_stage: Optional[str] = None
    error_message: Optional[str] = None
    retry_count: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DocumentListItem(DocumentResponse):
    pass

class JobResultCreate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    summary: Optional[str] = None
    keywords: Optional[List[str]] = None
    extracted_metadata: Optional[Dict[str, Any]] = None
    raw_output: Optional[Dict[str, Any]] = None

class JobResultUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    summary: Optional[str] = None
    keywords: Optional[List[str]] = None

class JobResultResponse(BaseModel):
    id: str
    document_id: str
    title: Optional[str] = None
    category: Optional[str] = None
    summary: Optional[str] = None
    keywords: Optional[List[str]] = None
    extracted_metadata: Optional[Dict[str, Any]] = None
    is_finalized: bool
    raw_output: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class JobDetailResponse(BaseModel):
    document: DocumentResponse
    result: Optional[JobResultResponse] = None
    
class ProgressEvent(BaseModel):
    stage: str
    progress: int
    message: str
    timestamp: str

class ExportData(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    title: Optional[str] = None
    category: Optional[str] = None
    summary: Optional[str] = None
    keywords: Optional[List[str]] = None
    is_finalized: bool
    created_at: datetime
    updated_at: datetime
