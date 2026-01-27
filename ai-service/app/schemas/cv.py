from pydantic import BaseModel, Field
from typing import List, Optional


class CVRequest(BaseModel):
    name: str
    experience: str
    skills: List[str]

class CVResponse(BaseModel):
    cv_text: str



    