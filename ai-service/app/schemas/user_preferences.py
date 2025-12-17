from pydantic import BaseModel
from typing import Optional, List

class UserPreferences(BaseModel):
  user_id: str
  technology_slugs: Optional[List[str]] = None  # ["python", "fastapi"]
  remote: Optional[bool] = None  # True, False, lub None (obojętne)
  hybrid: Optional[bool] = None
  seniority_levels: Optional[List[str]] = None  # ["senior", "mid"]
  countries: Optional[List[str]] = None  # ["USA", "Poland"]
  excluded_companies: Optional[List[str]] = None

class UserPreferencesCreate(UserPreferences):
  pass

class UserPreferencesResponse(UserPreferences):
  id: str