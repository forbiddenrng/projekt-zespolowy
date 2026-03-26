from aiohttp import ClientSession, ClientTimeout
import os
from app.core.config import settings
from datetime import datetime, timezone, timedelta
from app.clients.mongodb_client import mongodb
from bson import ObjectId

class CVGenerationService:
  def __init__(self):
    self.collection = mongodb.db["cv_generation_tasks"]
    self.tz = timezone(timedelta(hours=1))
    
  async def create_task(self, user_id: str, job_offer: str = ""):
    """Create task record in database"""
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
    """Get task status"""
    try:
      task = await self.collection.find_one({"_id": ObjectId(task_id)})
      if task:
          task["_id"] = str(task["_id"])
      return task
    except:
      return None
  
  async def update_task_status(self, task_id: str, status: str, **kwargs):
    """Update task status"""
    try:
      await self.collection.update_one(
          {"_id": ObjectId(task_id)},
          {"$set": {**kwargs, "status": status, "updated_at": datetime.now(self.tz)}}
      )
    except Exception as e:
      print(f"Error updating task: {e}")

  async def check_generation_limit(self, user_id: str, limit: int = 5, time_window_minutes: int = 10) -> dict:

    now = datetime.now(self.tz)
    time_window_start = now - timedelta(minutes=time_window_minutes)

    # count tasks startet in x miutes
    count = await self.collection.count_documents({
      "user_id": user_id,
      "created_at": {"$gte": time_window_start}
    })

    result = {
      "allowed": count < limit,
      "current_count": count,
      "limit": limit
    }

    if count >= limit:
      # find oldest task in time window to get reset time
      oldest_task = await self.collection.find_one(
        {
          "user_id": user_id,
          "created_at": {"$gte": time_window_start}
        },
        sort =[("created_at", 1)]
      )
      if oldest_task:
        reset_time = oldest_task["created_at"] + timedelta(minutes=time_window_minutes)
        result["reset_time"] = reset_time

    return result
  
  async def search_tasks(
    self,
    user_id: str,
    status: str = None,
    skip: int = 0,
    limit: int = 10,
    sort_by: str = "created_at",
    sort_order: int = -1
  ) -> dict:
    """Search user tasks based on status with pagination and sort"""
    
    query = {"user_id": user_id}
    
    if status:
      query["status"] = status
    
    total = await self.collection.count_documents(query)
    
    tasks = []
    cursor = self.collection.find(query).sort(sort_by, sort_order).skip(skip).limit(limit)
    
    async for task in cursor:
      task["_id"] = str(task["_id"])
      tasks.append(task)
    
    return {
      "tasks": tasks,
      "total": total,
      "skip": skip,
      "limit": limit,
      "count": len(tasks)
    }
    
  
  
  async def send_webhook(self, user_id: str, task_id: str, status: str, pdf_url: str = None):
      """Send weebhook as a notification"""
      
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
        "timestamp": datetime.now(self.tz).isoformat(),
      }
      
      async with ClientSession() as session:
        try:
          async with session.post(webhook_url, json=payload, timeout=ClientTimeout(total=10)) as resp:
              print(f"Webhook sent: {resp.status}")
        except Exception as e:
          print(f"Webhook error: {e}")