from typing import Optional, List, Any
from datetime import datetime, timezone, timedelta
# from motor.motor_asyncio import AsyncDatabase
from app.schemas.user_preferences import UserPreferencesCreate

class UserPreferencesService:
  def __init__(self, db: Any):
    self.db = db
    self.collection = db["user_preferences"]
    self.tz = timezone(timedelta(hours=1))

  async def save_preferences(self, user_id: str, prefs: UserPreferencesCreate):
    """Create or update user preferencs"""
    result = await self.collection.update_one(
      {"user_id": user_id},
      {
        "$set": {
            **prefs.model_dump(),
            "updated_at": datetime.now()
        },
        "$setOnInsert": {"created_at": datetime.now(self.tz)}
      },
      upsert=True
    )
    return result

  async def get_preferences(self, user_id: str) -> Optional[dict]:
    """Get user preferences"""
    prefs = await self.collection.find_one({"user_id": user_id})
    if prefs:
      prefs["_id"] = str(prefs["_id"])
    return prefs

  async def get_all_users(self) -> List[dict]:
    """Get all users with preferences"""
    cursor = self.collection.find()
    users = await cursor.to_list(length=None)
    for user in users:
      user["_id"] = str(user["_id"])
    return users