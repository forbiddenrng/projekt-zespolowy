from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
from app.schemas.enums import SeniorityLevel

class PyObjectId(ObjectId):
  @classmethod
  def __get_validators__(cls):
    yield cls.validate

  @classmethod
  def validate(cls, v):
    if not ObjectId.is_valid(v):
      raise ValueError("Invalid objectid")
    return str(v)

class Company(BaseModel):
  name: str
  country: Optional[str] = None
  logo_url: Optional[str] = None

class Salary(BaseModel):
  min_annual_salary: Optional[int] = None
  max_annual_salary: Optional[int] = None
  salary_currency: Optional[str] = None

class Location(BaseModel):
  country_name: Optional[str] = None
  display_name: Optional[str] = None

class JobOfferBase(BaseModel):
  external_id: int
  title: str
  company: Company
  location: List[Location]
  description: Optional[str] = None
  salary: Salary
  source_url: Optional[str] = None
  employment_statuses: List[str]
  technology_slugs: List[str]
  remote: Optional[bool] = None
  hybrid: Optional[bool] = None
  seniority: Optional[SeniorityLevel] = None
  date_posted: str


class JobOfferCreate(JobOfferBase):
  pass

class JobOffer(JobOfferBase):
  id: PyObjectId = Field(alias="_id")
  created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
  updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

  class Config:
    populate_by_name = True
    arbitrary_types_allowed = True
    json_schema_extra = {
      "example": {
        "_id": "507f1f77bcf86cd799439011",
        "external_id": 123,
        "title": "Senior Python Developer",
        "company": {
          "name": "Google",
          "country": "USA",
          "logo_url": "https://example.com/google.png"
        },
        "location": [
          {
            "country_name": "United States",
            "display_name": "San Francisco, CA"
          }
        ],
        "description": "Looking for...",
        "salary": {
          "min_annual_salary": 150000,
          "max_annual_salary": 200000,
          "salary_currency": "USD"
        },
        "source_url": "https://theirstack.com/jobs/123",
        "employment_statuses": ["full-time"],
        "technology_slugs": ["python", "fastapi"],
        "remote": True,
        "hybrid": False,
        "seniority": "senior",
        "date_posted": "2024-12-16",
        "created_at": "2024-12-16T10:00:00+00:00",
        "updated_at": "2024-12-16T10:00:00+00:00"
      }
    }