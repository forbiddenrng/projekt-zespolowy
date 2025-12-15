from fastapi import APIRouter
from app.api.v1 import cv

router = APIRouter()
router.include_router(cv.router)