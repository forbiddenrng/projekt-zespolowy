from pydantic import BaseModel
from typing import List

class CVRequest(BaseModel):
    name: str
    experience: str
    skillas: List[str]

class CVResponse(BaseModel):
    cv_text: str