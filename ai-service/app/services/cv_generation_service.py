import aiohttp
import os
from datetime import datetime, timezone
from app.clients.mongodb_client import mongodb
from bson import ObjectId

class CVGenerationService:
  def __init__(self):
    self.collection = mongodb.db["cv_generation_tasks"]
    
  async def create_task(self, user_id: str, job_offer: str = ""):
    """Utwórz rekord zadania w bazie danych"""
    task = {
      "user_id": user_id,
      "job_offer": job_offer,
      "status": "PENDING",
      "created_at": datetime.now(timezone.utc),
      "started_at": None,
      "completed_at": None,
      "pdf_path": None,
      "error": None,
    }
    result = await self.collection.insert_one(task)
    return str(result.inserted_id)
  
  async def get_task(self, task_id: str):
    """Pobierz status zadania"""
    try:
      task = await self.collection.find_one({"_id": ObjectId(task_id)})
      if task:
          task["_id"] = str(task["_id"])
      return task
    except:
      return None
  
  async def update_task_status(self, task_id: str, status: str, **kwargs):
    """Zaktualizuj status zadania"""
    try:
      await self.collection.update_one(
          {"_id": ObjectId(task_id)},
          {"$set": {**kwargs, "status": status, "updated_at": datetime.now(timezone.utc)}}
      )
    except Exception as e:
      print(f"Error updating task: {e}")
  
  async def send_webhook(self, user_id: str, task_id: str, status: str, pdf_url: str = None):
      """Wyślij powiadomienie przez webhook"""
      from app.core.config import settings
      
      webhook_url = getattr(settings, "USER_SERVICE_WEBHOOK_URL", None)
      if not webhook_url:
        print("Webhook URL not configured")
        return
      
      payload = {
        "event": "cv.generated",
        "user_id": user_id,
        "task_id": task_id,
        "status": status,
        "pdf_url": pdf_url,
        "timestamp": datetime.now(timezone.utc).isoformat(),
      }
      
      async with aiohttp.ClientSession() as session:
        try:
          async with session.post(webhook_url, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as resp:
              print(f"Webhook sent: {resp.status}")
        except Exception as e:
          print(f"Webhook error: {e}")