from pydantic import BaseModel
from typing import Optional, List

class UserPreferencesBase(BaseModel):
  technology_slugs: Optional[List[str]] = None  # ["python", "fastapi"]
  remote: Optional[bool] = None  # True, False, lub None (obojętne)
  hybrid: Optional[bool] = None
  seniority_levels: Optional[List[str]] = None  # ["senior", "mid"]
  countries: Optional[List[str]] = None  # ["USA", "Poland"]
  excluded_companies: Optional[List[str]] = None

## schemat do tworzenia preferencji
class UserPreferencesCreate(UserPreferencesBase):
  pass

## schemat do przechowywania w bazie
class UserPreferences(UserPreferencesBase):
  user_id: str

#Schema zwracany w API
class UserPreferencesResponse(UserPreferences):
  id: Optional[str] = None