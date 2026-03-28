import os
from celery import Celery

BROKER_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
RESULT_BACKEND = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Handle Render's TLS Redis URL
if BROKER_URL.startswith("rediss://"):
    celery_app = Celery(
        'doc_processor',
        broker=BROKER_URL,
        backend=RESULT_BACKEND,
        broker_use_ssl={'ssl_cert_reqs': None},
        redis_backend_use_ssl={'ssl_cert_reqs': None}
    )
else:
    celery_app = Celery(
        'doc_processor',
        broker=BROKER_URL,
        backend=RESULT_BACKEND
    )

celery_app.conf.update(
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='UTC',
    task_track_started=True,
    worker_prefetch_multiplier=1
)
