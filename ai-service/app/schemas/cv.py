from pydantic import BaseModel
from typing import List

class CVRequest(BaseModel):
    name: str
    experience: str
    skills: List[str]

class CVResponse(BaseModel):
    cv_text: str