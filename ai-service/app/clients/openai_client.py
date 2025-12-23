import json
from openai import OpenAI
from app.core.config import settings

client = OpenAI(
  base_url=settings.OPENROUTER_URL,
  api_key=settings.OPENROUTER_API_KEY,
)

def generate_cv_data(user_info: str, job_offer: str) -> str:
    """Generuje dane CV w formacie JSON na podstawie danych użytkownika"""
    prompt = f"""
    Na podstawie podanych informacji o użytkowniku i oferty pracy wygeneruj profesjonalne CV. Odpowiedź zwróć jako JSON.

    Informacje o użytkowniku: {user_info}
    Oferta pracy: {job_offer}

    Zwróć JSON z następującą strukturą:
    {{
        "full_name": "...",
        "email": "...",
        "phone": "...",
        "city": "...",
        "professioal_summary": "...",
        "quick_summary": "...",
        "experience": [
            {{"position": "...", "company": "...", "start_date": "...", "end_date": "...", "description": "..." }}
        ],
        "education": [
            {{"degree": "...", "institution": "...", "year": "..."}}
        ],
        "skills": ["...", "..."],
        "certificates": [
            {{"name": "...", "certification_date": "...", "issuer": "..."}}
        ],
        "languages": [
            {{"name": "...", "level": "..."}}
        ],
        "links": [
            {{"linkString": "...", "name": "..."}}
        ]
    }}
    """
    response = client.chat.completions.create(
        model=settings.OPENROUTER_MODEL,
        messages=[
            {"role": "system", "content": "Jesteś profesjonalnym ekspertem w pisaniu CV. Rozmiesz obecną sytuację na rynku i wiesz, że każda osoba szukająca pracy musi mieć dopasowane CV do konkretnej oferty. Na podstawie danych o użytkowniku oraz konkretnej oferty pracy tworzysz dane do CV. Zawsze zwracasz odpowiedź jako JSON"},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        response_format={"type": "json_object"} 
    )
    content = response.choices[0].message.content
    return json.loads(content) if content else {}


result = generate_cv_data("Jan Kowalski", "Software developer")
print(result)

