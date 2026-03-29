from jinja2 import Template, FileSystemLoader, Environment
import os
from datetime import datetime, timezone
from pathlib import Path
from weasyprint import HTML
import aiofiles
from io import BytesIO


class CoverLetterService:
  def __init__(self):
    self.local_storage_path = Path(os.getenv("COVER_LETTER_STORAGE_PATH", "storage/cover_letters"))
    self.local_storage_path.mkdir(parents=True, exist_ok=True)

    
  def generate_cover_letter_html(self, cover_letter_data: dict) -> str:
    """Generate cover letter HTML"""
    template_loader = FileSystemLoader(searchpath="app/services")
    template_env = Environment(loader=template_loader)
    template = template_env.get_template("cover_letter_template.html")

    html_final = template.render(cover_letter_data)
    return html_final

    
  async def save_pdf(self, user_id: str, task_id: str, pdf_html: str) -> str:
    """Save pdf locally"""
    return await self._save_locally(user_id, task_id, pdf_html)
    
  async def _save_locally(self, user_id: str, task_id: str, pdf_html: str) -> str:
    """Save pdf in storage/cover_letters/YYYY/MM/user_id/task_id.pdf"""
    now = datetime.now(timezone.utc)
    user_dir = self.local_storage_path / str(now.year) / f"{now.month:02d}" / user_id
    user_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = user_dir / f"{task_id}.pdf"

    HTML(string=pdf_html).write_pdf(str(file_path))
    
    return f"{now.year}/{now.month:02d}/{user_id}/{task_id}.pdf"
    
  async def get_pdf(self, pdf_path: str) -> bytes:
    """Get pdf"""
    return await self._get_locally(pdf_path)
    
  async def _get_locally(self, pdf_path: str) -> bytes:
    """Get pdf from disk"""
    file_path = self.local_storage_path / pdf_path
    async with aiofiles.open(file_path, "rb") as f:
        return await f.read()