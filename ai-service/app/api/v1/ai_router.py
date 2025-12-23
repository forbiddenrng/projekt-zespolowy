from fastapi import APIRouter, Depends, HTTPException, Query, Header
from typing import List, Optional
from app.api.v1.job_router import get_user_id
from app.clients.userservice_client import UserServiceClient

router = APIRouter(prefix="/ai", tags=["ai"])

def get_user_service_client():
  return UserServiceClient()

@router.post("/generate/cv")
async def generate_cv(
  user_id: str = Depends(get_user_id),
  job_offer: str = "",
  client: UserServiceClient = Depends(get_user_service_client)
):
  """Generate CV based on user data from user service and job offer"""
  user_data = await client.get_user_data(user_id)
  print(user_data)
  