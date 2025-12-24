from jinja2 import Template, FileSystemLoader, Environment
import os
from datetime import datetime, timezone
from pathlib import Path
from weasyprint import HTML
import aiofiles
from io import BytesIO

# import tempfile


class CVService:
    def __init__(self):
        self.local_storage_path = Path(os.getenv("CV_STORAGE_PATH", "storage/cvs"))
        self.local_storage_path.mkdir(parents=True, exist_ok=True)

    
    def generate_cv_html(self, cv_data: dict) -> str:
        """Wygeneruj PDF CV"""
        template_loader = FileSystemLoader(searchpath="app/services")
        template_env = Environment(loader=template_loader)
        template = template_env.get_template("template.html")

        html_final = template.render(cv_data)
        return html_final

    
    async def save_pdf(self, user_id: str, task_id: str, pdf_html: str) -> str:
        """Przechowaj PDF lokalnie"""
        return await self._save_locally(user_id, task_id, pdf_html)
    
    async def _save_locally(self, user_id: str, task_id: str, pdf_html: str) -> str:
        """Przechowaj PDF lokalnie w strukturze: storage/cvs/YYYY/MM/user_id/task_id.pdf"""
        now = datetime.now(timezone.utc)
        user_dir = self.local_storage_path / str(now.year) / f"{now.month:02d}" / user_id
        user_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = user_dir / f"{task_id}.pdf"

        # async with aiofiles.open(file_path, "wb") as f:
        #     await f.write(pdf_bytes)

        HTML(string=pdf_html).write_pdf(str(file_path))
        # pdf_bytes= HTML(string=pdf_html).write_pdf()
        # async with aiofiles.open(file_path, "wb") as f:
        #     await f.write(pdf_bytes)
        
        return f"{now.year}/{now.month:02d}/{user_id}/{task_id}.pdf"
    
    async def get_pdf(self, pdf_path: str) -> bytes:
        """Pobierz PDF z dysku"""
        return await self._get_locally(pdf_path)
    
    async def _get_locally(self, pdf_path: str) -> bytes:
        """Pobierz PDF z dysku"""
        file_path = self.local_storage_path / pdf_path
        async with aiofiles.open(file_path, "rb") as f:
            return await f.read()


# Test
import asyncio

async def test_cv_generation():
    cv_data = {
        "full_name": "Jan Kowalski",
        "quick_summary": "Doświadczony developer Python",
        "email": "jan@example.com",
        "phone_number": "+48123456789",
        "city": "Warszawa",
        "links": [],
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
        "certificates": [],
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
    # pass