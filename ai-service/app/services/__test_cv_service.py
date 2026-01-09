# Test
import asyncio
from app.services.cv_service import CVService

async def test_cv_generation():
    cv_data = {
        "full_name": "Jan Kowalski",
        "quick_summary": "Doświadczony developer Python",
        "summary": "Doświadczony fullstack developer w Python oraz Node.",
        "email": "jan@example.com",
        "phone_number": "+48123456789",
        "city": "Warszawa",
        "links": [
          {"linkString": "https://github.com/profile", "name": "Github"}
        ],
        "experience": [
            {
                "position": "Senior Developer",
                "company": "TechCorp",
                "start_date": "2020",
                "end_date": "2024",
                "description": "Rozwój aplikacji webowych w Pythonie i JavaScripcie"
            }
        ],
        "education": [
            {
                "degree": "Licencjat",
                "major": "Informatyka",
                "school_name": "Uniwersytet Warszawski",
                "start_date": "2016",
                "end_date": "2020"
            }
        ],
        "skills": ["Python", "JavaScript", "React", "FastAPI", "Django"],
        "certificates": [
          {"name": "Git and Github", "certification_date": "20-11-2025", "issuer": "Github"}
        ],
        "languages": [
            {"name": "Polski", "level": "Ojczysty"},
            {"name": "Angielski", "level": "Biegły"}
        ]
    }
    
    cv = CVService()
    cv_html = cv.generate_cv_html(cv_data)
    
    
    path = await cv.save_pdf("test_user", "test_task_1", pdf_html=cv_html)
    print(f"PDF zapisany: {path}")

if __name__ == "__main__":
  asyncio.run(test_cv_generation())


# run test as a docker container 
#docker run -v ${PWD}:/app -v ${PWD}/wyjscie:/app/wyjscie ai-service python -m app.services.__test_cv_service
