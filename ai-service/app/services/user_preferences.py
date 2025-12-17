from typing import Optional, List
from datetime import datetime
from motor.motor_asyncio import AsyncDatabase
from app.schemas.user_preferences import UserPreferences, UserPreferencesCreate

class UserPreferencesService:
  def __init__(self, db: AsyncDatabase):
    self.db = db
    self.collection = db["user_preferences"]

  async def save_preferences(self, user_id: str, prefs: UserPreferencesCreate):
    """Zapisz lub zaktualizuj preferencje użytkownika"""
    result = await self.collection.update_one(
      {"user_id": user_id},
      {
        "$set": {
            **prefs.model_dump(),
            "updated_at": datetime.now()
        },
        "$setOnInsert": {"created_at": datetime.now()}
      },
      upsert=True
    )
    return result

  async def get_preferences(self, user_id: str) -> Optional[dict]:
    """Pobierz preferencje użytkownika"""
    return await self.collection.find_one({"user_id": user_id})

  async def get_all_users(self) -> List[dict]:
    """Pobierz wszystkich użytkowników z preferencjami"""
    cursor = self.collection.find()
    return await cursor.to_list(length=None)