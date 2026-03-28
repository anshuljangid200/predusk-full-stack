import json
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import Document
from ..redis_client import get_redis_client

router = APIRouter()
logger = logging.getLogger(__name__)

def event_generator(document_id: str, current_status: str, current_progress: int, current_stage: str):
    if current_status in ["completed", "failed"]:
        event_dict = {
            "stage": current_stage or current_status,
            "progress": current_progress,
            "message": "Job finished.",
            "timestamp": datetime.utcnow().isoformat()
        }
        yield f"data: {json.dumps(event_dict)}\n\n"
        return

    redis_cli = get_redis_client()
    pubsub = redis_cli.pubsub()
    channel = f"job:{document_id}"
    pubsub.subscribe(channel)

    try:
        # We use a sync loop, Starlette will iterate synchronously if it's a sync generator within a threadpool
        for message in pubsub.listen():
            if message["type"] == "message":
                data = message["data"].decode("utf-8")
                yield f"data: {data}\n\n"
                
                # Check for termination
                try:
                    parsed = json.loads(data)
                    if parsed.get("stage") in ["job_completed", "job_failed"]:
                        break
                except Exception:
                    pass
    except GeneratorExit:
        logger.info(f"Client disconnected for document {document_id}")
    finally:
        pubsub.unsubscribe(channel)
        pubsub.close()

@router.get("/progress/{document_id}")
async def stream_progress(document_id: str, db: AsyncSession = Depends(get_db)):
    doc = await db.scalar(select(Document).filter(Document.id == document_id))
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    return StreamingResponse(
        event_generator(document_id, doc.status, doc.progress, doc.current_stage),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )
