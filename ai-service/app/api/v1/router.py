from fastapi import APIRouter
from app.api.v1 import cv, ai_router

router = APIRouter()
router.include_router(cv.router)
router.include_router(ai_router.router)