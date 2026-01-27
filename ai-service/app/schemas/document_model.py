from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


"""
Model for CV
"""


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


"""
Models for cover letter
"""


class GenerateLetterRequest(BaseModel):
  """Model for cover letter generation request"""
  job_offer: Optional[str] = Field(
    default="",
    description="Job offer text to tailor letter to"
  )
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



"""
Responses
"""

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



class TaskItem(BaseModel):
  """Model for task item in search results"""
  task_id: str = Field(description="Task identifier")
  status: str = Field(description="Task status")
  created_at: datetime = Field(description="Creation timestamp")
  completed_at: Optional[datetime] = Field(default=None, description="Completion timestamp")
  error: Optional[str] = Field(default=None, description="Error message if failed")

  class Config:
    json_schema_extra = {
      "example": {
        "task_id": "507f1f77bcf86cd799439011",
        "status": "COMPLETED",
        "created_at": "2025-01-13T10:30:00+01:00",
        "completed_at": "2025-01-13T10:35:00+01:00",
        "error": None
      }
    }

class TaskSearchResponse(BaseModel):
  """Response model for task search"""
  tasks: List[TaskItem] = Field(description="List of tasks")
  total: int = Field(description="Total number of tasks matching filter")
  skip: int = Field(description="Number of records skipped")
  limit: int = Field(description="Limit of records per page")
  count: int = Field(description="Number of tasks in current page")

  class Config:
    json_schema_extra = {
      "example": {
        "tasks": [
          {
            "task_id": "507f1f77bcf86cd799439011",
            "status": "COMPLETED",
            "created_at": "2025-01-13T10:30:00+01:00",
            "completed_at": "2025-01-13T10:35:00+01:00",
            "error": None
          }
        ],
        "total": 15,
        "skip": 0,
        "limit": 10,
        "count": 10
      }
    }


"""
Error
"""

class ErrorResponse(BaseModel):
  """Response model for error cases"""
  detail: str = Field(description="Error description")

  class Config:
    json_schema_extra = {
      "example": {
        "detail": "Task not found",
      }
    } 