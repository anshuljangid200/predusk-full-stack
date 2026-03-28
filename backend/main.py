import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import os
import re
import logging
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.routers import upload, jobs, progress, results, retry, export

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Async Document Processing Workflow")

# ─── CORS ────────────────────────────────────────────────────────────────────
# Allow all localhost ports (3000-3999) for dev + production Vercel URLs
FRONTEND_URL = os.getenv("FRONTEND_URL", "")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # ← allow all origins in dev; tighten for prod
    allow_credentials=False,      # must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(upload.router,   prefix="/api")
app.include_router(jobs.router,     prefix="/api")
app.include_router(progress.router, prefix="/api")
app.include_router(results.router,  prefix="/api")
app.include_router(retry.router,    prefix="/api")
app.include_router(export.router,   prefix="/api")

# ─── Startup: run DB migrations ───────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    import asyncio
    from alembic.config import Config
    from alembic import command

    def run_upgrade():
        script_dir = os.path.dirname(os.path.abspath(__file__))
        ini_path    = os.path.join(script_dir, "alembic.ini")
        alembic_cfg = Config(ini_path)
        alembic_cfg.set_main_option("script_location", os.path.join(script_dir, "alembic"))
        command.upgrade(alembic_cfg, "head")

    logger.info("Running alembic upgrade head …")
    try:
        await asyncio.to_thread(run_upgrade)
        logger.info("Migrations applied successfully.")
    except Exception as e:
        logger.error(f"Alembic upgrade failed (DB may not be ready): {e}")

# ─── Health ───────────────────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
