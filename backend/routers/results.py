from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import Document, JobResult
from ..schemas import JobResultUpdate, JobResultResponse

router = APIRouter()

@router.put("/jobs/{document_id}/result", response_model=JobResultResponse)
async def update_result(document_id: str, data: JobResultUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.scalar(select(JobResult).filter(JobResult.document_id == document_id))
    if not result:
        raise HTTPException(status_code=404, detail="Job result not found")
        
    if result.is_finalized:
        raise HTTPException(status_code=400, detail="Cannot edit a finalized result")
        
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(result, k, v)
        
    await db.commit()
    await db.refresh(result)
    return result

@router.post("/jobs/{document_id}/finalize", response_model=JobResultResponse)
async def finalize_result(document_id: str, db: AsyncSession = Depends(get_db)):
    doc = await db.scalar(select(Document).filter(Document.id == document_id))
    if not doc or doc.status != 'completed':
        raise HTTPException(status_code=400, detail="Document not complete")
        
    result = await db.scalar(select(JobResult).filter(JobResult.document_id == document_id))
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
        
    result.is_finalized = True
    await db.commit()
    await db.refresh(result)
    return result
