from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.database import get_db
from backend.models import Document
from backend.schemas import DocumentResponse
from backend.worker import process_document

router = APIRouter()

@router.post("/jobs/{document_id}/retry", response_model=DocumentResponse)
async def retry_job(document_id: str, db: AsyncSession = Depends(get_db)):
    doc = await db.scalar(select(Document).filter(Document.id == document_id))
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if doc.status != 'failed':
        raise HTTPException(status_code=400, detail="Only failed jobs can be retried")
        
    doc.status = 'queued'
    doc.progress = 0
    doc.current_stage = None
    doc.error_message = None
    doc.retry_count += 1
    
    await db.commit()
    await db.refresh(doc)
    
    process_document.delay(str(doc.id))
    
    return doc
