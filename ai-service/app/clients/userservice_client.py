import httpx
# from typing import List, Dict, Any, Optional, Set
from app.core.config import settings


class UserServiceClient:
  def __init__(self):
    self.base_url = settings.USER_SERVICE_URL
    self.headers = {
      "Content-Type": "application/json"
    }

  async def get_user_data(self, user_id: str):
    try:
      async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
          f"{self.base_url}/{user_id}?all=true",
          headers=self.headers
        )
        response.raise_for_status()
        data = response.json()

        return data.data
      
    except httpx.HTTPStatusError as e:
      print(f"HTTP Error: {e.response.status_code}: {e.response.text}")
      raise
    except Exception as e:
      print(f"Error: {e}")
      raise
