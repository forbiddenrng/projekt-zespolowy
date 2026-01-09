from fastapi import APIRouter, Depends, HTTPException, Query, Header, Path
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.api.v1.job_router import get_user_id
from app.clients.userservice_client import UserServiceClient
from app.services.cv_generation_service import CVGenerationService
from app.services.cv_service import CVService
from app.services.cv_task import generate_cv_task
from io import BytesIO

router = APIRouter(prefix="/ai", tags=["ai"])

class GenerateCVRequest(BaseModel):
  """Model for CV generation request"""
  job_offer: Optional[str] = Field(
    default="",
    description="Job offer text to tailor CV to"
  )
  class Config:
    json_schema_extra = {
      "example": {
        "job_offer": "We are hiring a Python developer with 5+ years of experience"
      }
    }

class GenerateCVResponse(BaseModel):
  """Response model for CV generation request"""
  message: str = Field(description="Status message")
  task_id: str = Field(description="Unique task identifier for tracking")
  status: str = Field(description="Current status of the task")

  class Config: 
    json_schema_extra = {
      "example": {
        "message": "CV generation started",
        "task_id": "507f1f77bcf86cd799439011",
        "status": "PENDING"
      }
    }

class CVStatusResponse(BaseModel):
  """Response model for CV status check"""
  task_id: str = Field(description="Unique task identifier")
  status: str = Field(description="Task status: PENDING, IN_PROGRESS, COMPLETED, FAILED")
  error: Optional[str] = Field(default=None, description="Error message")
  created_at: Optional[datetime] = Field(default=None, description="Task creation timestamp")
  completed_at: Optional[datetime] = Field(default=None, description="Task completion timestamp")

  class Config: 
    json_schema_extra = {
      "example": {
        "task_id": "507f1f77bcf86cd799439011",
        "status": "COMPLETED",
        "error": None,
        "created_at": "2025-12-28T10:30:00",
        "completed_at": "2025-12-28T10:35:00"
      }
    }

class ErrorResponse(BaseModel):
  """Response model for error cases"""
  detail: str = Field(description="Error description")

  class Config:
    json_schema_extra = {
      "example": {
        "detail": "Task not found",
      }
    } 


def get_user_service_client():
  return UserServiceClient()

def get_cv_generation_service():
  return CVGenerationService()

def get_cv_service():
  return CVService()


async def verify_task_ownership(
  task_id: str,
  user_id: str = Depends(get_user_id),
  cv_gen_service: CVGenerationService = Depends(get_cv_generation_service)
) -> dict:
  """Verify that the user owns the task.
  
  Raises:
    - 404 HTTPException if task not found
    - 401 HTTPException if user doesn't own the task
  """
  task = await cv_gen_service.get_task(task_id)

  if not task:
    raise HTTPException(status_code=404, detail="Task not found")
  
  if task.get("user_id") != user_id:
    raise HTTPException(status_code=401, detail="Unauthorized - you don't have access to this task")
  
  return task


@router.post(
  "/generate/cv",
  response_model=GenerateCVResponse,
  responses={
    400: {"model": ErrorResponse, "description": "Bad request"},
    401: {"model": ErrorResponse, "description": "Unauthorized"},
  }
)
async def generate_cv(
  user_id: str = Depends(get_user_id),
  request: GenerateCVRequest = None,
  cv_gen_service: CVGenerationService = Depends(get_cv_generation_service)
):
  """Generate CV based on user data from user service and job offer

  This endpoint:
    - Creates a new CV generation task
    - Returns immediately with a task ID
    - Processes CV generation asynchronously using Celery
    
    Required: User authentication (via user_id)
  """

  job_offer = request.job_offer if request else ""

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

@router.get(
  "/generate/cv/{task_id}/status",
  response_model=CVStatusResponse,
  responses={
    404: {"model": ErrorResponse, "description": "Task not found"},
    401: {"model": ErrorResponse, "description": "Unauthorized - you don't have access to this task"}
  }
)
async def get_cv_status(
  task_id: str = Path(..., description="Task identifier returned from CV generation endpoint"),
  task: dict = Depends(verify_task_ownership)
  # cv_gen_service: CVGenerationService = Depends(get_cv_generation_service)
):
  "Check CV status"
  # task = await cv_gen_service.get_task(task_id)

  # if not task:
  #   raise HTTPException(status_code=404, detail="Task not found")
  
  return {
    "task_id": task_id,
    "status": task["status"],
    "error": task.get("error"),
    "created_at": task.get("created_at"),
    "completed_at": task.get("completed_at")
  }
  
@router.get(
  "/cv/{task_id}/download",
  response_class=StreamingResponse,
  responses={
    404: {"model": ErrorResponse, "description": "Task not found or PDF file not found"},
    400: {"model": ErrorResponse, "description": "CV not ready yet"},
    401: {"model": ErrorResponse, "description": "Unauthorized - you don't have access to this task"}
  }
)
async def download_cv(
  task_id: str = Path(..., description="Task identifier returned from CV generation endpoint"),

  task: dict = Depends(verify_task_ownership),
  cv_service: CVService = Depends(get_cv_service)
  ):
  """Download generated CV as PDF"""
  
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



  