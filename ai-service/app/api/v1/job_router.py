from fastapi import APIRouter, Depends, HTTPException, Query, Header
from typing import List, Optional
from app.services.job_offer_service import JobOfferService
from app.services.user_preferences import UserPreferencesService
from app.schemas.user_preferences import UserPreferencesCreate
from app.clients.mongodb_client import mongodb
from app.schemas.user_preferences import GetPreferencesResponse, CreatePreferencesResponse

router = APIRouter(prefix="/api", tags=["jobs"])

async def get_job_service() -> JobOfferService:
  db = mongodb.get_db()
  return JobOfferService(db)

async def get_preferences_service() -> UserPreferencesService:
  db = mongodb.get_db()
  return UserPreferencesService(db)

async def get_user_id(x_user: Optional[str] = Header(None)) -> str: 
  if not x_user:
    raise HTTPException(
      status_code=401,
      detail="No X-User header"
    )
  return x_user
    
@router.post("/preferences", response_model=CreatePreferencesResponse)
async def save_user_preferences(
    preferences: UserPreferencesCreate,
    user_id: str = Depends(get_user_id),
    service: UserPreferencesService = Depends(get_preferences_service)
):
    """Zapisz lub zaktualizuj preferencje użytkownika"""
    await service.save_preferences(user_id, preferences)
    return {
        "status": "success",
        "user_id": user_id,
        "message": "Preferencje zaktualizowane"
    }

@router.get("/preferences", response_model=GetPreferencesResponse)
async def get_user_preferences(
    user_id: str = Depends(get_user_id),
    service: UserPreferencesService = Depends(get_preferences_service)
):
    """Pobierz preferencje użytkownika"""
    prefs = await service.get_preferences(user_id)
    if not prefs:
      raise HTTPException(status_code=404, detail="Preferences not found")
    return prefs

@router.get("/recommended-jobs")
async def get_recommended_jobs(
    user_id: str = Depends(get_user_id),
    job_service: JobOfferService = Depends(get_job_service),
    pref_service: UserPreferencesService = Depends(get_preferences_service)
):
    """Pobierz oferty dostosowane do preferencji użytkownika"""
    prefs = await pref_service.get_preferences(user_id)
    if not prefs:
        raise HTTPException(status_code=404, detail="You need to set preferences")

    offers = await job_service.get_offers_for_user(prefs)
    
    return {
        "user_id": user_id,
        "count": len(offers),
        "data": offers
    }

@router.get("/jobs")
async def list_all_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    service: JobOfferService = Depends(get_job_service)
):
    """Pobierz wszystkie dostępne oferty"""
    offers = await service.get_all_offers(skip=skip, limit=limit)
    count = await service.count_offers()
    return {
      "total": count,
      "skip": skip,
      "limit": limit,
      "data": offers
    }