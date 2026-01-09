from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import router
from app.api.v1.job_router import router as job_router
from app.api.v1.ai_router import router as ai_router
from app.clients.mongodb_client import mongodb


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await mongodb.connect_db()
    yield
    # Shutdown
    await mongodb.close_db()

app = FastAPI(title="AI Service", lifespan=lifespan)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai-service"}

app.include_router(router)
app.include_router(job_router)
app.include_router(ai_router)
