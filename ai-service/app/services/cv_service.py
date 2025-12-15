from app.clients.openai_client import generate_text
from app.services.prompt_builder import build_cv_prompt

def generate_cv(data: dict) -> str:
    prompt = build_cv_prompt(data)
    return generate_text(prompt)