from fastapi import APIRouter, Depends, HTTPException, Query, Header, Path
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
# from pytz import timezone as pytz_timezone
from zoneinfo import ZoneInfo

from app.api.v1.job_router import get_user_id
from app.clients.userservice_client import UserServiceClient
from app.services.cv_generation_service import CVGenerationService
from app.services.cv_service import CVService
from app.services.cover_letter_generation_service import CoverLetterGenerationService
from app.services.cover_letter_service import CoverLetterService
from app.services.cv_task import generate_cv_task
from app.services.cover_letter_task import generate_cover_letter_task
from io import BytesIO

router = APIRouter(prefix="/ai", tags=["ai"])

tz_utc = timezone.utc
tz_warsaw = ZoneInfo('Europe/Warsaw')

def _conver_datetime_to_warsaw(dt: datetime) -> datetime:
  if not dt:
    return dt
  if dt.tzinfo is None:
    dt = dt.replace(tzinfo=tz_utc)
  return dt.astimezone(tz_warsaw)

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

class GenerateLetterRequest(BaseModel):
  """Model for CV generation request"""
  job_offer: Optional[str] = Field(
    default="",
    description="Job offer text to tailor letter to"
  ),
  company_info: Optional[str] = Field(
    default="",
    description="Company info text to tailor letter to"
  )

  class Config:
    json_schema_extra = {
      "example": {
        "job_offer": "We are hiring a Python developer with 5+ years of experience"
      }
    }


class GenerateDocumentResponse(BaseModel):
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

class DocumentStatusResponse(BaseModel):
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

def get_cover_letter_service():
  return CoverLetterService()

def get_cover_letter_generation_service():
  return CoverLetterGenerationService()


async def verify_cv_task_ownership(
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


async def check_cv_generation_rate_limit(
  user_id: str,
  cv_gen_service: CVGenerationService = Depends(get_cv_generation_service)
):
  """Middleware to check user limit for generating CV"""
  limit_check = await cv_gen_service.check_generation_limit(
    user_id=user_id,
    limit=5,
    time_window_minutes=10
  )

  if not limit_check["allowed"]:
    reset_time = limit_check.get("reset_time")
    raise HTTPException(
      status_code=429,
      detail={
        "error": "Rate limit exceeded",
        "message": f"You have reached the limit of {limit_check['limit']} documents per 10 minutes",
        "current_count": limit_check["current_count"],
        "limit": limit_check["limit"],
        "reset_time": reset_time.isoformat() if reset_time else None
      }
    )
  return limit_check


async def check_letter_generation_rate_limit(
  user_id: str,
  letter_service: CoverLetterGenerationService = Depends(get_cover_letter_generation_service)
):
  """Middleware to check user limit for generating CV"""
  limit_check = await letter_service.check_generation_limit(
    user_id=user_id,
    limit=5,
    time_window_minutes=10
  )

  if not limit_check["allowed"]:
    reset_time = limit_check.get("reset_time")
    raise HTTPException(
      status_code=429,
      detail={
        "error": "Rate limit exceeded",
        "message": f"You have reached the limit of {limit_check['limit']} documents per 10 minutes",
        "current_count": limit_check["current_count"],
        "limit": limit_check["limit"],
        "reset_time": reset_time.isoformat() if reset_time else None
      }
    )
  return limit_check


async def verify_letter_task_ownership(
  task_id: str,
  user_id: str = Depends(get_user_id),
  cover_letter_gen_service: CoverLetterGenerationService = Depends(get_cover_letter_generation_service)
) -> dict:
  """Verify that the user owns the task.
  
  Raises:
    - 404 HTTPException if task not found
    - 401 HTTPException if user doesn't own the task
  """
  task = await cover_letter_gen_service.get_task(task_id)

  if not task:
    raise HTTPException(status_code=404, detail="Task not found")
  
  if task.get("user_id") != user_id:
    raise HTTPException(status_code=401, detail="Unauthorized - you don't have access to this task")
  
  return task

"""
CV generation endpoitns
"""

@router.post(
  "/generate/cv",
  response_model=GenerateDocumentResponse,
  responses={
    400: {"model": ErrorResponse, "description": "Bad request"},
    401: {"model": ErrorResponse, "description": "Unauthorized"},
    429: {"description": "Rate limit exceeded"}
  }
)
async def generate_cv(
  user_id: str = Depends(get_user_id),
  request: GenerateCVRequest = None,
  rate_limit: dict = Depends(check_cv_generation_rate_limit),
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
  response_model=DocumentStatusResponse,
  responses={
    404: {"model": ErrorResponse, "description": "Task not found"},
    401: {"model": ErrorResponse, "description": "Unauthorized - you don't have access to this task"}
  }
)
async def get_cv_status(
  task_id: str = Path(..., description="Task identifier returned from CV generation endpoint"),
  task: dict = Depends(verify_cv_task_ownership)
  # cv_gen_service: CVGenerationService = Depends(get_cv_generation_service)
):
  "Check CV status"
  
  return {
    "task_id": task_id,
    "status": task["status"],
    "error": task.get("error"),
    "created_at": _conver_datetime_to_warsaw(task.get("created_at")),
    "completed_at": _conver_datetime_to_warsaw(task.get("completed_at"))
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

  task: dict = Depends(verify_cv_task_ownership),
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

"""
Covering letter generation endpoitns
"""

@router.post(
  "/generate/cover-letter",
  response_model=GenerateDocumentResponse,
  responses={
    400: {"model": ErrorResponse, "description": "Bad request"},
    401: {"model": ErrorResponse, "description": "Unauthorized"},
    429: {"description": "Rate limit exceeded"}
  }
)
async def generate_cover_letter(
  user_id: str = Depends(get_user_id),
  request: GenerateLetterRequest = None,
  rate_limit: dict = Depends(check_letter_generation_rate_limit),
  cover_letter_gen_service: CoverLetterGenerationService = Depends(get_cover_letter_generation_service)
):
  """Generate cover letter based on user data from user service, job offer and company info

  This endpoint:
    - Creates a new cover letter generation task
    - Returns immediately with a task ID
    - Processes letter generation asynchronously using Celery
    
    Required: User authentication (via user_id)
  """

  job_offer = request.job_offer if request else ""
  company_info = request.company_info if request else ""

  # Create task record in database
  task_id = await cover_letter_gen_service.create_task(user_id,  job_offer)

  # Run Celery task asynch
  generate_cover_letter_task.delay(task_id, user_id, job_offer, company_info)

  # Response
  return {
    "message": "Cover letter generation started",
    "task_id": task_id,
    "status": "PENDING"
  }

@router.get(
  "/generate/cover-letter/{task_id}/status",
  response_model=DocumentStatusResponse,
  responses={
    404: {"model": ErrorResponse, "description": "Task not found"},
    401: {"model": ErrorResponse, "description": "Unauthorized - you don't have access to this task"}
  }
)
async def get_cover_letter_status(
  task_id: str = Path(..., description="Task identifier returned from CV generation endpoint"),
  task: dict = Depends(verify_letter_task_ownership)
  # cv_gen_service: CVGenerationService = Depends(get_cv_generation_service)
):
  "Check letter status"
  
  return {
    "task_id": task_id,
    "status": task["status"],
    "error": task.get("error"),
    "created_at": _conver_datetime_to_warsaw(task.get("created_at")),
    "completed_at": _conver_datetime_to_warsaw(task.get("completed_at"))
  }
  
@router.get(
  "/cover-letter/{task_id}/download",
  response_class=StreamingResponse,
  responses={
    404: {"model": ErrorResponse, "description": "Task not found or PDF file not found"},
    400: {"model": ErrorResponse, "description": "Cover letter not ready yet"},
    401: {"model": ErrorResponse, "description": "Unauthorized - you don't have access to this task"}
  }
)
async def download_cover_letter(
  task_id: str = Path(..., description="Task identifier returned from cover letter generation endpoint"),

  task: dict = Depends(verify_letter_task_ownership),
  cover_letter_service: CoverLetterService = Depends(get_cover_letter_service)
  ):
  """Download generated cover letter as PDF"""
  
  if task["status"] != "COMPLETED":
    raise HTTPException(status_code=400, detail=f"Letter not ready. Status: {task['status']}")
  
  pdf_path = task.get("pdf_path")

  if not pdf_path:
    raise HTTPException(status_code=404, detail="PDF file not found")
  
  pdf_bytes = await cover_letter_service.get_pdf(pdf_path)

  return StreamingResponse(
    BytesIO(pdf_bytes),
    media_type="application/pdf",
    headers={
      "Content-Disposition": f"attachment; filename=cv_{task_id}.pdf"
    }
  )