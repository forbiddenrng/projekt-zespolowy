import json
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
    if not x_user or not x_user.strip():
        raise HTTPException(
            status_code=401,
            detail="No X-User header"
        )
    try:
        obj = json.loads(x_user) if x_user.strip(
        ).startswith("{") else {"id": x_user}
        uid = obj.get("id")
        if not uid:
            raise ValueError("Missing id in x-user")
        return str(uid)
    except Exception:
        # fallback: use header value
        return x_user


@router.post("/preferences", response_model=CreatePreferencesResponse)
async def save_user_preferences(
    preferences: UserPreferencesCreate,
    user_id: str = Depends(get_user_id),
    service: UserPreferencesService = Depends(get_preferences_service)
):
    """Save or update user preferences"""
    result = await service.save_preferences(user_id, preferences)
    # return result
    print(result)
    return {
        "status": "success",
        "message": "Preferences updated"
    }


@router.get("/preferences", response_model=GetPreferencesResponse)
async def get_user_preferences(
    user_id: str = Depends(get_user_id),
    service: UserPreferencesService = Depends(get_preferences_service)
):
    """Get user preferences"""
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
    """Get job offers that fit user preferences"""
    prefs = await pref_service.get_preferences(user_id)
    if not prefs:
        raise HTTPException(
            status_code=404, detail="You need to set preferences")

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
    """Get all available job offers"""
    offers = await service.get_all_offers(skip=skip, limit=limit)
    count = await service.count_offers()
    return {
        "total": count,
        "skip": skip,
        "limit": limit,
        "data": offers
    }
