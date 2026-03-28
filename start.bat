@echo off
echo Starting Async Document Processing System...

echo Checking for requirements...
IF NOT EXIST "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

echo Activating venv and installing Python dependencies...
call venv\Scripts\activate.bat
pip install -r backend\requirements.txt

echo Applying database migrations (requires local PostgreSQL on 5432)...
set DATABASE_URL=postgresql+asyncpg://postgres:password@localhost/docprocessor
python -c "import psycopg2; from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT; conn = psycopg2.connect('postgresql://postgres:password@localhost/postgres'); conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT); cur = conn.cursor(); cur.execute('CREATE DATABASE docprocessor') if not cur.connection.closed else None" 2>nul
alembic -c backend\alembic.ini upgrade head

echo Starting Backend APIs (FastAPI)...
start cmd /k "title FastAPI Backend && call venv\Scripts\activate.bat && set DATABASE_URL=postgresql+asyncpg://postgres:password@localhost/docprocessor && set REDIS_URL=redis://localhost:6379/0 && uvicorn backend.main:app --reload"

echo Starting Background Worker (Celery)...
start cmd /k "title Celery Worker && call venv\Scripts\activate.bat && set DATABASE_URL=postgresql+asyncpg://postgres:password@localhost/docprocessor && set REDIS_URL=redis://localhost:6379/0 && celery -A backend.celery_app worker --loglevel=info --pool=solo"

echo Starting Frontend (Next.js)...
cd frontend
if not exist node_modules (
    echo Installing NPM dependencies...
    npm install
)
start cmd /k "title Next.js Frontend && npm run dev"

echo All services are starting in new windows!
pause
