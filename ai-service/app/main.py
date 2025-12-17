from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.api.v1.router import router
from app.api.v1.job_router import router as job_router
from app.clients.mongodb_client import mongodb

@asynccontextmanager
async def lifespan(app: FastAPI):
  # Startup
  await mongodb.connect_db()
  yield
  # Shutdown
  await mongodb.close_db()

app = FastAPI(title="AI Service", lifespan=lifespan)

app.include_router(router)
app.include_router(job_router)