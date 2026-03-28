# Async Document Processing Workflow System

A production-ready asynchronous document processing application built with FastAPI, Next.js, Celery, Redis, and PostgreSQL.

## Features
- **Async Processing Pipeline**: Offload heavy document processing to Celery workers.
- **Real-time Progress**: Server-Sent Events (SSE) broadcast granular progress updates to the frontend via Redis Pub/Sub.
- **Robust Storage**: PostgreSQL database with SQLAlchemy 2.0 ORM (Async and Sync where appropriate).
- **Responsive Dashboard**: Beautiful UI built with Next.js and Tailwind CSS to track and manage jobs.
- **Result Editing & Export**: Review extracted metadata, modify summaries/keywords, finalize results, and export to JSON or CSV.

## Architecture

```text
Browser → Vercel (Next.js) → Render Web Service (FastAPI)
                                      ↓              ↓
                                 PostgreSQL       Redis
                                                   ↓
                             Render Worker (Celery) ←┘
```

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | Next.js 14, React 18, Tailwind CSS, TypeScript |
| Backend API | Python 3.11, FastAPI, Uvicorn |
| Background Jobs | Celery |
| Broker / Pub/Sub | Redis |
| Database | PostgreSQL (asyncpg for API, psycopg2 for worker) |
| Migrations | Alembic |
| Hosting | Vercel (Frontend), Render (Backend/DB/Redis) |

## Local Development Setup

1. **Prerequisites**
   - Python 3.11+
   - Node.js 18+
   - Redis server running locally on `localhost:6379`
   - PostgreSQL server running locally on `localhost:5432`

2. **Backend Setup**
   ```bash
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   
   # Install dependencies
   pip install -r backend/requirements.txt
   
   # Set environment variables (or create .env file)
   export DATABASE_URL=postgresql+asyncpg://user:password@localhost/docprocessor
   export REDIS_URL=redis://localhost:6379/0
   
   # Run migrations (ensure Python path includes root)
   PYTHONPATH=. alembic -c backend/alembic.ini upgrade head
   
   # Start FastAPI server
   uvicorn backend.main:app --reload
   
   # Start Celery worker in a new terminal
   celery -A backend.celery_app worker --loglevel=info
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Create .env.local
   echo NEXT_PUBLIC_API_URL=http://localhost:8000/api > .env.local
   
   # Start development server
   npm run dev
   ```

## Render.com Deployment Steps

1. Create a GitHub repository and push this code.
2. Log into [Render.com](https://render.com) and go to the **Blueprints** tab.
3. Click "New Blueprint Instance" and connect your repository.
4. Render will automatically detect the `render.yaml` file in the root directory.
5. Review the plan. It will create:
   - A PostgreSQL Database
   - A Redis Instance
   - A Web Service for FastAPI
   - A Background Worker for Celery
6. Click "Apply". Render will automatically provision databases, inject URLs, and build/deploy your web and worker services.
7. Once deployed, note the FastAPI Web Service URL (e.g., `https://doc-processor-api.onrender.com`).

## Vercel Deployment Steps

1. Go to [Vercel](https://vercel.com) and import your Git repository.
2. Ensure the Framework Preset is set to **Next.js**.
3. Set the Root Directory to `frontend`.
4. In Environment Variables, add:
   - `NEXT_PUBLIC_API_URL`: The URL of your Render Web Service (e.g., `https://doc-processor-api.onrender.com/api`).
5. Click **Deploy**.
6. After Vercel deployment completes, copy your new Vercel app URL.
7. Go back to Render Dashboard → Web Service → Environment Variables. Update `FRONTEND_URL` to your Vercel URL and save. The API will restart to allow CORS from your frontend.

## Environment Variables

| Variable | Description | Where to Set |
|---|---|---|
| `DATABASE_URL` | Connection string to PostgreSQL | Render (Auto), Local |
| `REDIS_URL` | Connection string to Redis | Render (Auto), Local |
| `FRONTEND_URL` | URL of the frontend app (for CORS) | Render Web Service |
| `NEXT_PUBLIC_API_URL` | External URL of the backend API | Vercel, Local `.env.local` |
| `PYTHON_VERSION` | Python runtime version | Render (`3.11.0`) |

## API Reference

| Method | Path | Description | Notes |
|---|---|---|---|
| POST | `/api/upload` | Upload multiple files | Max 10MB per file |
| GET | `/api/jobs` | Get paginated list of jobs | Accepts `status`, `search`, `page` |
| GET | `/api/jobs/{id}` | Get specific job & results | |
| GET | `/api/progress/{id}` | Stream job progress (SSE) | Server-Sent Events |
| PUT | `/api/jobs/{id}/result`| Update drafted result | Fails if finalized |
| POST | `/api/jobs/{id}/finalize` | Mark result as final | Cannot be edited after |
| POST | `/api/jobs/{id}/retry` | Retry a failed job | Resets progress |
| GET | `/api/jobs/{id}/export` | Export result as CSV/JSON | Must be finalized |

## Assumptions & Tradeoffs
- **File Storage**: Files are stored in the PostgreSQL database as Base64 text. While convenient for this prototype to avoid S3 complexities, a real production system would store active files in an object store (S3, GCS) and only save the URI in the database.
- **Sync/Async SQLAlchemy**: FastAPI handlers use `asyncpg` for high concurrency, whereas the Celery worker uses synchronous `psycopg2` since Celery tasks are synchronous by design. 
- **Retry Mechanism**: Transient failures intentionally raise exceptions so Celery's `max_retries` takes effect.

## Limitations
- Actual file parsing is simulated using time delays in the worker to demonstrate the UI tracking workflow. Real extraction libraries (like PyMuPDF or python-docx) would need to be integrated for actual document parsing.

---
_AI assistance: Claude AI used for scaffolding._
