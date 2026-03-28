from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, asc, func
from pydantic import BaseModel
from ..database import get_db
from ..models import Document, JobResult
from ..schemas import DocumentListItem, JobDetailResponse

router = APIRouter()

class JobsPaginatedResponse(BaseModel):
    items: list[DocumentListItem]
    total: int
    page: int
    pages: int

@router.get("/jobs", response_model=JobsPaginatedResponse)
async def get_jobs(
    search: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = Query("created_at", description="created_at | filename | status"),
    sort_dir: str = Query("desc", description="asc | desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    query = select(Document)
    
    if search:
        query = query.filter(Document.filename.ilike(f"%{search}%"))
        
    if status and status.lower() != "all":
        query = query.filter(Document.status == status.lower())
        
    # Count
    count_stmt = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_stmt)
    
    # Sorting
    order_col = getattr(Document, sort_by, Document.created_at)
    if sort_dir == "desc":
        query = query.order_by(desc(order_col))
    else:
        query = query.order_by(asc(order_col))
        
    # Pagination
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.scalars(query)
    items = result.all()
    
    return {
        "items": [DocumentListItem.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "pages": (total + page_size - 1) // page_size if total > 0 else 1
    }

@router.get("/jobs/{document_id}", response_model=JobDetailResponse)
async def get_job(document_id: str, db: AsyncSession = Depends(get_db)):
    doc = await db.scalar(select(Document).filter(Document.id == document_id))
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    job_result = await db.scalar(select(JobResult).filter(JobResult.document_id == document_id))
    
    return {
        "document": doc,
        "result": job_result
    }
