import json
from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(
    base_url=settings.OPENROUTER_URL,
    api_key=settings.OPENROUTER_API_KEY,
)

def _validate_cv_structure(data: dict) -> None:
    """Waliduj strukturę danych CV"""
    required_fields = ["summary", "quick_summary", "skills", "certificates", "languages", "links", "education", "experience"]
    
    # check if all fields exist
    missing_fields = []
    for field in required_fields:
        if field not in data:
            missing_fields.append(field)
        elif data[field] is None:
            missing_fields.append(field)
    
    if missing_fields:
        raise ValueError(f"Missing required fields: {missing_fields}")
    
    # validate string fields
    string_fields = ["summary", "quick_summary"]
    for field in string_fields:
        if not isinstance(data[field], str) or not data[field].strip():
            raise ValueError(f"Field '{field}' must be a non-empty string")
    
    # validate list fields
    array_fields = ["skills", "certificates", "languages", "links", "education", "experience"]
    for field in array_fields:
        if not isinstance(data[field], list):
            raise ValueError(f"Field '{field}' must be an array")
    
    # vaidate skills
    for idx, skill in enumerate(data["skills"]):
        if not isinstance(skill, str) or not skill.strip():
            raise ValueError(f"skills[{idx}] must be a non-empty string")
    
    # validate certs
    for idx, cert in enumerate(data["certificates"]):
        if not isinstance(cert, dict):
            raise ValueError(f"certificates[{idx}] must be an object")
        required_cert_fields = ["name", "certification_date", "issuer"]
        for field in required_cert_fields:
            if field not in cert or not cert[field] or (isinstance(cert[field], str) and not cert[field].strip()):
                raise ValueError(f"certificates[{idx}].{field} is required and cannot be empty")
    
    # validate langs
    for idx, lang in enumerate(data["languages"]):
        if not isinstance(lang, dict):
            raise ValueError(f"languages[{idx}] must be an object")
        required_lang_fields = ["name", "level"]
        for field in required_lang_fields:
            if field not in lang or not lang[field] or (isinstance(lang[field], str) and not lang[field].strip()):
                raise ValueError(f"languages[{idx}].{field} is required and cannot be empty")
    
    # validate links
    for idx, link in enumerate(data["links"]):
        if not isinstance(link, dict):
            raise ValueError(f"links[{idx}] must be an object")
        required_link_fields = ["linkString", "name"]
        for field in required_link_fields:
            if field not in link or not link[field] or (isinstance(link[field], str) and not link[field].strip()):
                raise ValueError(f"links[{idx}].{field} is required and cannot be empty")
    
    # validate edu
    for idx, edu in enumerate(data["education"]):
        if not isinstance(edu, dict):
            raise ValueError(f"education[{idx}] must be an object")
        required_edu_fields = ["degree", "major", "school_name", "start_date"]
        for field in required_edu_fields:
            if field not in edu or not edu[field] or (isinstance(edu[field], str) and not edu[field].strip()):
                raise ValueError(f"education[{idx}].{field} is required and cannot be empty")
    
    # validate experience
    for idx, exp in enumerate(data["experience"]):
        if not isinstance(exp, dict):
            raise ValueError(f"experience[{idx}] must be an object")
        required_exp_fields = ["position", "company", "start_date", "description"]
        for field in required_exp_fields:
            if field not in exp or not exp[field] or (isinstance(exp[field], str) and not exp[field].strip()):
                raise ValueError(f"experience[{idx}].{field} is required and cannot be empty")




async def generate_cv_data(user_info: dict, job_offer: str) -> dict:
    """Generuje dane CV w formacie JSON na podstawie danych użytkownika"""

    user_info_str = json.dumps(user_info, ensure_ascii=False) if isinstance(
        user_info, dict) else str(user_info)

    header = f"""
    Na podstawie podanych informacji o użytkowniku i oferty pracy wygeneruj profesjonalne CV. Masz napisć to w 1 osobie - z perspektywy użytkownika.  Odpowiedź zwróć jako JSON. 

    Z dostępnych danych o użytkowniku wybierz najlepsze dopasowanie umiejętności i certyfikatów do danej oferty pracy. 
    Poniżej znajdziesz dane o użytkowniku oraz samą ofertę pracy.

    Informacje o użytkowniku: {user_info_str}
    Oferta pracy: {job_offer}

    Opis pól, które masz zwrócić: 
    summary - profesjonalne podsumowanie danego kandydata na podstawie pola profile_summary (z informacji o użytkowniku) oraz reszty jego danych. Podsumowanie to jest w 1 osobie, z perspektywy użytkownika.
    quick_summary - krótkie podsumowanie danego użytkownika na podstawie jego umiejętności i doświadczenia. Np: Python developer | Backend engineer | Fullstack engineer | Cloud Architect
    links - tablica linkow ktore ma uzytkownik np linkedin github. Zwróć tablicę obiektow {{linkString, name}} gdzie linkString pochodzi z danych o użytkowniku a name to nazwa portlu na który wskazuje link (Np. Linkedin, github ... Name musisz samodzielnie podać na podstawie linku)
    
    """

    schema = """
    Zwróć JSON z następującą strukturą:
    {
        "summary": "...",
        "quick_summary": "...",
        "links": [
            {"linkString": "...", "name": "..."}
        ]
    }
    """

    prompt = header + "\n" + schema

    response = await client.chat.completions.create(
        model=settings.OPENROUTER_MODEL,
        messages=[
            {"role": "system", "content": "Jesteś profesjonalnym ekspertem w pisaniu CV. Rozumiesz obecną sytuację na rynku i wiesz, że każda osoba szukająca pracy musi mieć dopasowane CV do konkretnej oferty. Na podstawie danych o użytkowniku oraz konkretnej oferty pracy tworzysz dane do CV. Zawsze zwracasz odpowiedź jako JSON"},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        response_format={"type": "json_object"}
    )
    content = response.choices[0].message.content

    if not content or not content.strip():
        print(f"ERROR: Empty response from OpenRouter API")
        print(f"Full response: {response}")
        raise ValueError("OpenRouter API returned empty response")

    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON response from API: {str(e)}")
    
    # try:
    #     _validate_cv_structure(data)
    # except ValueError as e:
    #     print(f"ERROR: CV structure validation failed: {e}")
    #     raise

    return data


async def generate_cover_letter_data(user_info: dict, job_offer: str, company_info: str) -> dict:
    """Generate coverng letter data in JSON based on user data"""
    user_info_str = json.dumps(user_info, ensure_ascii=False) if isinstance(
        user_info, dict) else str(user_info)
    
    header = f"""
    Twoim zadaniem jest zwrócenie JSON na podstawie podanych informacji o użytkowniku, oferty pracy oraz informacji o firmie wygeneruj profesjonalny list motywacyjny. Wykorzystujesz tylko podane informacje, posłgujesz się profesjonalnym, korporacyjnym językiem.

    Informacje o użytkowniku: {user_info_str}
    Oferta pracy: {job_offer}
    Dane firmy: {company_info}

    W odpowiedzi JSON masz zwrócić tylko następujące pola. Zwróć tylko jedną odpowiedź w formacie JSON i nie dodawaj żadnych innych komentarzy.

    salution - zwrot grzecznościowy np. Szanowni Państwo. (krótki, maksymalnie 2 słowa)

    introduction - dlaczego piszesz dany list motywacyjny, na jakie stanowisko aplikujesz. Zaczynasz z małej litery bo jest to kontynuacja zdania rozpoczętego w salution. Na koniec introduction napisz jedno zdanie, które oznajmi rekruterowi że możesz wnieść do firmy coś od siebie. Ta część ma mieć od 3-4 zdań. 

    body - główne osiągnięcia zawodowe na podstawie dostarczonych informacji o użytkowniu. Co udało mu się osiągnąć i jak może pozytywnie wpłynąć to na rozwój firmy do której pisany jest list. To główna część, ma zawierać od 5-8 zdań. Na koniec tej części wspomnieć o wykształceniu użytkownika, jednak ma to być jedynie uzupełnienie do wcześniejszego fragmentu - nie więcej niż 2 zdania. 

    closing - podziękowanie za poświęcony czas w procesie rekrutacyjnym, wyrażenie chęci do udziału w następnych etapach procesu rekrutacyjnego. Ten fragment ma zawierać nie więcej niż 3 zdania. 

    signature - zwrot kończący list, np. Z wyrazami szacunku, <Imie i nazwisko kandydata>
    """

    schema = """
    {
        "salution": "...",
        "introduction": "...",
        "body": "...",
        "closing": "...",
        "signature": "...",
    }

    Przykładowa odopowiedź: 
    {
        "salution": "Szanowni Państwo,"
        "introduction": "piszę aby wyrazić zainteresowanie ofertą pracy",
        "body": "Podczas praktyk w firmie X uczesniczyłem w podobnym projekcie w który zaangażowany jest Wasza firma",
        "closing": "Uprzejmie dziękuję za czas poświęcony i rozważanie mojej aplikacji"
        "signature": "Z wyrazami szacunku, XYZ"
    }
    """

    prompt = header + "\n" + schema

    response = await client.chat.completions.create(
        model=settings.OPENROUTER_MODEL,
        messages=[
            {"role": "system", "content": "Jesteś profesjonalnym ekspertem w toworzeniu listów motywacyjnych. Możesz odpowidać na żądania jedynie w formacie JSON. Rozumiesz obecną sytuację na rynku i wiesz, że każda osoba szukająca pracy musi mieć dopasowane dokumenty aplikacyjne do konkretnej oferty. Na podstawie danych o użytkowniku oraz konkretnej oferty pracy tworzysz dane do listów motywacyjnych."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        response_format={"type": "json_object"}
    )
    content = response.choices[0].message.content

    if not content or not content.strip():
        print(f"ERROR: Empty response from OpenRouter API")
        print(f"Full response: {response}")
        raise ValueError("OpenRouter API returned empty response")

    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON response from API: {str(e)}")
    
    required_fields = ["salution", "introduction", "body", "closing", "signature"]
    missing_fields = []
    
    for field in required_fields:
        if field not in data:
            missing_fields.append(field)
        elif data[field] is None or (isinstance(data[field], str) and not data[field].strip()):
            missing_fields.append(field)
    
    if missing_fields:
        raise ValueError(f"Missing or empty required fields in API response: {missing_fields}")
    
    return data

    
