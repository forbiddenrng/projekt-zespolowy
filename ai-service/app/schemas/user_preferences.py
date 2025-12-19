from pydantic import BaseModel, field_validator
from typing import Optional, List
from app.schemas.enums import CountryCode, SeniorityLevel

class UserPreferencesBase(BaseModel):
  technology_slugs: Optional[List[str]] = None 
  remote: Optional[bool] = None 
  hybrid: Optional[bool] = None
  seniority_levels: Optional[List[SeniorityLevel]] = None 
  countries: Optional[List[CountryCode]] = None  

  @field_validator('seniority_levels', mode='before')
  @classmethod
  def validate_seniority_levels(cls, v):
    if v is None:
      return v
    return [SeniorityLevel(item) if isinstance(item, str) else item for item in v]

  @field_validator('countries', mode='before')
  @classmethod
  def validate_countries(cls, v):
    if v is None:
      return v
    return [CountryCode(item) if isinstance(item, str) else item for item in v]

## Schema for creating preferences
class UserPreferencesCreate(UserPreferencesBase):
  pass

## Schema for storing preferences in database
class UserPreferences(UserPreferencesBase):
  user_id: str

#Schema returned by API
class UserPreferencesResponse(UserPreferences):
  id: Optional[str] = None

class CreatePreferencesResponse(BaseModel):
  status: str
  # user_id: str
  message: str

class GetPreferencesResponse(UserPreferencesBase):
  _id: str
  # user_id: str
