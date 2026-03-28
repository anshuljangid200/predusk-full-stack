import base64
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.models import Document
from backend.schemas import DocumentResponse
from backend.worker import process_document

router = APIRouter()

ALLOWED_TYPES = {"pdf", "txt", "docx", "jpg", "jpeg", "png", "csv", "doc"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("/upload", response_model=List[DocumentResponse])
async def upload_documents(files: List[UploadFile] = File(...), db: AsyncSession = Depends(get_db)):
    responses = []
    
    for file in files:
        ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
        if ext not in ALLOWED_TYPES:
            raise HTTPException(status_code=400, detail=f"File type {ext} not allowed")
            
        content = await file.read()
        file_size = len(content)
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File {file.filename} exceeds 10MB limit")
            
        base64_content = base64.b64encode(content).decode('utf-8')
        
        doc = Document(
            filename=file.filename,
            file_type=ext,
            file_size=file_size,
            file_content=base64_content,
            status="queued"
        )
        
        db.add(doc)
        await db.commit()
        await db.refresh(doc)
        
        # Trigger Celery task
        # Pass document_id as strong strictly
        process_document.delay(str(doc.id))
        
        responses.append(doc)
        
    return responses
