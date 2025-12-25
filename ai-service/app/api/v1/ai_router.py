from fastapi import APIRouter, Depends, HTTPException, Query, Header
from fastapi.responses import StreamingResponse
from typing import List, Optional
from app.api.v1.job_router import get_user_id
from app.clients.userservice_client import UserServiceClient
from app.services.cv_generation_service import CVGenerationService
from app.services.cv_service import CVService
from app.services.cv_task import generate_cv_task
from io import BytesIO

router = APIRouter(prefix="/ai", tags=["ai"])

def get_user_service_client():
  return UserServiceClient()

def get_cv_generation_service():
  return CVGenerationService()

def get_cv_service():
  return CVService()

@router.post("/generate/cv")
async def generate_cv(
  user_id: str = Depends(get_user_id),
  job_offer: str = "",
  cv_gen_service: CVGenerationService = Depends(get_cv_generation_service)
):
  """Generate CV based on user data from user service and job offer"""

  # Create task record in database
  task_id = await cv_gen_service.create_task(user_id,  job_offer)

  # Run Celery task asynch
  generate_cv_task.delay(task_id, user_id, job_offer)

  # Response
  return {
    "message": "CV generation started",
    "task_id": task_id,
    "status": "PENDING"
  }

@router.get("/generate/cv/{task_id}/status")
async def get_cv_status(
  task_id: str,
  cv_gen_service: CVGenerationService = Depends(get_cv_generation_service)
):
  "Check CV status"
  task = await cv_gen_service.get_task(task_id)

  if not task:
    raise HTTPException(status_code=404, detail="Task not found")
  
  return {
    "task_id": task_id,
    "status": task["status"],
    "pdf_path": task.get("pdf_path"),
    "error": task.get("error"),
    "created_at": task.get("created_at"),
    "completed_at": task.get("completed_at")
  }
  
@router.get("/cv/{task_id}/download")
async def download_cv(
  task_id: str,
  cv_gen_service: CVGenerationService = Depends(get_cv_generation_service),
  cv_service: CVService = Depends(CVService)
  ):
  """Download generated CV as PDF"""

  # get task
  task = await cv_gen_service.get_task(task_id)

  if not task:
    raise HTTPException(status_code=404, detail="Task not found")
  
  if task["status"] != "COMPLETED":
    raise HTTPException(status_code=400, detail=f"CV not ready. Status: {task['status']}")
  
  pdf_path = task.get("pdf_path")

  if not pdf_path:
    raise HTTPException(status_code=404, detail="PDF file not found")
  
  pdf_bytes = await cv_service.get_pdf(pdf_path)

  return StreamingResponse(
    BytesIO(pdf_bytes),
    media_type="application/pdf",
    headers={
      "Content-Disposition": f"attachment; filename=cv_{task_id}.pdf"
    }
  )



  