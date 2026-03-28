import os
import json
import redis
from datetime import datetime

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Setup synchronous Redis client
if REDIS_URL.startswith("rediss://"):
    redis_client = redis.from_url(REDIS_URL, ssl_cert_reqs=None)
else:
    redis_client = redis.from_url(REDIS_URL)

def get_redis_client():
    return redis_client

def publish_progress(document_id: str, stage: str, progress: int, message: str):
    payload = json.dumps({
        "stage": stage,
        "progress": progress,
        "message": message,
        "timestamp": datetime.utcnow().isoformat()
    })
    redis_client.publish(f"job:{document_id}", payload)
