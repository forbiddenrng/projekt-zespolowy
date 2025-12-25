from jinja2 import Template, FileSystemLoader, Environment
import os
from datetime import datetime, timezone
from pathlib import Path
from weasyprint import HTML
import aiofiles
from io import BytesIO


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
        
        return f"{now.year}/{now.month:02d}/{user_id}/{task_id}.pdf"
    
    async def get_pdf(self, pdf_path: str) -> bytes:
        """Pobierz PDF z dysku"""
        return await self._get_locally(pdf_path)
    
    async def _get_locally(self, pdf_path: str) -> bytes:
        """Pobierz PDF z dysku"""
        file_path = self.local_storage_path / pdf_path
        async with aiofiles.open(file_path, "rb") as f:
            return await f.read()
