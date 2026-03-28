import time
import logging
import re
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from backend.celery_app import celery_app
from backend.redis_client import publish_progress
from backend.database import DATABASE_URL
from backend.models import Document, JobResult

logger = logging.getLogger(__name__)

# Use SYNC engine for Celery worker — replace asyncpg with psycopg2
SYNC_DATABASE_URL = DATABASE_URL
if SYNC_DATABASE_URL.startswith("postgresql+asyncpg://"):
    SYNC_DATABASE_URL = SYNC_DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1)
elif SYNC_DATABASE_URL.startswith("postgres://"):
    SYNC_DATABASE_URL = SYNC_DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(SYNC_DATABASE_URL, echo=False, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_session() -> Session:
    return SessionLocal()


@celery_app.task(bind=True, max_retries=3, name='process_document')
def process_document(self, document_id: str):
    publish_progress(document_id, "job_started", 5, "Job started in worker...")
    time.sleep(0.5)

    session: Session = get_session()
    try:
        doc = session.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise ValueError(f"Document {document_id} not found")

        doc.status = "processing"
        session.commit()

        publish_progress(document_id, "parsing_started", 10, "Starting to parse document...")
        time.sleep(1.0)

        publish_progress(document_id, "parsing_completed", 30, "Document parsed.")
        time.sleep(0.5)

        publish_progress(document_id, "extraction_started", 40, "Extracting text and metadata...")
        time.sleep(1.5)

        publish_progress(document_id, "extraction_completed", 70, "Extraction complete.")
        time.sleep(0.5)

        publish_progress(document_id, "storing_results", 85, "Storing results...")
        time.sleep(0.5)

        # Map extension to category
        ext = doc.file_type.lower()
        if ext == "pdf":
            category = "PDF Document"
        elif ext == "txt":
            category = "Text File"
        elif ext in ["docx", "doc"]:
            category = "Word Document"
        elif ext in ["jpg", "jpeg", "png", "gif"]:
            category = "Image"
        elif ext == "csv":
            category = "Spreadsheet"
        else:
            category = "Unknown"

        # Build title from filename without extension
        base_name = doc.filename.rsplit('.', 1)[0]
        title = base_name.replace('-', ' ').replace('_', ' ').title()

        # Build keywords from filename parts
        raw_keywords = re.split(r'[_ \-\.]', doc.filename)
        keywords = list(set([k.lower() for k in raw_keywords if len(k) > 2]))
        keywords.append(doc.file_type.lower())
        keywords.append("processed")
        keywords = list(set(keywords))

        summary = (
            f"Document '{doc.filename}' processed successfully. "
            f"File type: {doc.file_type}. Size: {doc.file_size} bytes. "
            f"Extracted {len(keywords)} keywords."
        )

        extracted_metadata = {
            "original_filename": doc.filename,
            "file_type": doc.file_type,
            "file_size_bytes": doc.file_size,
            "processed_at": datetime.utcnow().isoformat(),
            "word_count_estimate": doc.file_size // 5,
        }

        # Upsert job_result
        result = session.query(JobResult).filter(JobResult.document_id == document_id).first()
        if not result:
            result = JobResult(document_id=document_id)
            session.add(result)

        result.title = title
        result.category = category
        result.summary = summary
        result.keywords = keywords
        result.extracted_metadata = extracted_metadata
        result.raw_output = {"status": "success", "estimated_chars": doc.file_size // 2}

        # Mark document complete
        doc.status = "completed"
        doc.progress = 100
        doc.current_stage = "job_completed"

        session.commit()
        publish_progress(document_id, "job_completed", 100, "Processing completed successfully.")
        return {"status": "success", "document_id": document_id}

    except Exception as exc:
        logger.error(f"Error processing document {document_id}: {exc}")
        session.rollback()

        try:
            doc = session.query(Document).filter(Document.id == document_id).first()
            if doc:
                doc.status = "failed"
                doc.error_message = str(exc)
                session.commit()
        except Exception as inner:
            logger.error(f"Could not update document failure status: {inner}")

        publish_progress(document_id, "job_failed", 0, f"Error: {str(exc)}")
        raise self.retry(exc=exc)

    finally:
        session.close()
