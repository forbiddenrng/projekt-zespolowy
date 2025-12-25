import json
from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(
  base_url=settings.OPENROUTER_URL,
  api_key=settings.OPENROUTER_API_KEY,
)

async def generate_cv_data(user_info: dict, job_offer: str) -> dict:
    """Generuje dane CV w formacie JSON na podstawie danych użytkownika"""

    user_info_str = json.dumps(user_info, ensure_ascii=False) if isinstance(user_info, dict) else str(user_info)

    prompt = f"""
    Na podstawie podanych informacji o użytkowniku i oferty pracy wygeneruj profesjonalne CV. Odpowiedź zwróć jako JSON. 

    Z dostępnych danych o użytkowniku wybierz najlepsze dopasowanie umiejętności i certyfikatów do danej oferty pracy. 
    Poniżej znajdziesz dane o użytkowniku oraz samą ofertę pracy.

    Informacje o użytkowniku: {user_info_str}
    Oferta pracy: {job_offer}

    Opis pól, które masz zwrócić: 
    professional_summary - profesjonalne podsumowanie danego kandydata na podstawie pola profile_summary (z informacji o użytkowniku) oraz reszty jego danych.
    quick_summary - krótkie podsumowanie danego użytkownika na podstawie jego umiejętności i doświadczenia. Np: Python developer | Backend engineer | Fullstack engineer | Cloud Architect
    certificates - tablica certyfikatów, gdzie name - nazwa certyfikatu, certification_date - data wystawienia certyfikatu, issuer - wydawca certyfikatu
    languages - tablica jezykow jakie zna uzytkownik, name - nazwa jezyka, level - poziom jezyka
    links - tablica linkow ktore ma uzytkownik np linkedin github. Zwróć tablicę obiektow {{linkString, name}} gdzie linkString pochodzi z danych o użytkowniku a name to nazwa portlu na który wskazuje link (Np. Linkedin, github ... Name musisz samodzielnie podać na podstawie linku)
    education - tablica pozycji edukacji uzytkownika. degree - stopien studiow, major - kierunek, school_name - nazwa szkoly, start_date/end_date - poczatek/koniec
    experience - tablica pozycji doswiadczenia uzytkownika. position - stanowisko, company - firma, start/end date - od/do.
    description - opis obowiazkow itd.

    Zwróć JSON z następującą strukturą:
    {{
        "professioal_summary": "...",
        "quick_summary": "...",
        "skills": ["...", "..."],
        "certificates": [
            {{"name": "...", "certification_date": "...", "issuer": "..."}}
        ],
        "languages": [
            {{"name": "...", "level": "..."}}
        ],
        "links": [
            {{"linkString": "...", "name": "..."}}
        ],
        "education": [
        {{"degree": "...", "major": "...", "school_name": "...", "start_date": "...", "end_date": "..."}}
        ],
        "experience": [
            {
                "position": "...",
                "company": "...",
                "start_date": "...",
                "end_date": "...",
                "description": "..."
            }
        ],
    }}
    """
    response = await client.chat.completions.create(
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


