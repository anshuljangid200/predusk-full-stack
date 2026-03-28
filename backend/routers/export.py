import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import Document, JobResult
from ..schemas import ExportData

router = APIRouter()

@router.get("/jobs/{document_id}/export")
async def export_job(
    document_id: str,
    format: str = Query(..., description="json | csv"),
    db: AsyncSession = Depends(get_db)
):
    doc = await db.scalar(select(Document).filter(Document.id == document_id))
    result = await db.scalar(select(JobResult).filter(JobResult.document_id == document_id))
    
    if not doc or not result:
        raise HTTPException(status_code=404, detail="Job/Result not found")
        
    if not result.is_finalized:
        raise HTTPException(status_code=400, detail="Job result must be finalized to export")
        
    # JSON export
    if format == 'json':
        export_data = ExportData(
            id=doc.id,
            filename=doc.filename,
            file_type=doc.file_type,
            file_size=doc.file_size,
            title=result.title,
            category=result.category,
            summary=result.summary,
            keywords=result.keywords,
            is_finalized=result.is_finalized,
            created_at=doc.created_at,
            updated_at=doc.updated_at
        )
        
        return StreamingResponse(
            iter([export_data.model_dump_json()]),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=job_{doc.id}.json"}
        )
        
    # CSV export
    elif format == 'csv':
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "id", "filename", "file_type", "file_size", "title", "category",
            "summary", "keywords", "is_finalized", "created_at", "updated_at"
        ])
        
        # Row
        keywords_str = "|".join(result.keywords) if result.keywords else ""
        writer.writerow([
            doc.id, doc.filename, doc.file_type, doc.file_size, result.title, result.category,
            result.summary, keywords_str, result.is_finalized, doc.created_at.isoformat(),
            doc.updated_at.isoformat()
        ])
        
        output.seek(0)
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=job_{doc.id}.csv"}
        )
        
    else:
        raise HTTPException(status_code=400, detail="Unsupported format")
