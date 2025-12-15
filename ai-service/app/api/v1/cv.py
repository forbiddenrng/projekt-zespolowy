from fastapi import APIRouter
from app.schemas.cv import CVRequest, CVResponse
from app.services.cv_service import generate_cv

router = APIRouter(prefix="/cv", tags=["CV"])

@router.post("/generate", response_model=CVResponse)
def generate_cv_endpoint(request: CVRequest):
    cv = generate_cv(request.dict())
    return {"cv_text": cv}