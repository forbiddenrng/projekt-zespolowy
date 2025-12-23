from jinja2 import Template
# from weasyprint import HTML, CSS
from io import BytesIO
import os
from datetime import datetime, timezone
from pathlib import Path
import aiofiles
import fpdf



CV_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, sans-serif;
            max-width: 900px;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .header {
            border-bottom: 2px solid #2c3e50;
            margin-bottom: 20px;
            padding-bottom: 15px;
        }
        .name {
            font-size: 32px;
            font-weight: bold;
            color: #2c3e50;
        }
        .contact {
    font-size: 12px;
    color: #7f8c8d;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
    margin-top: 10px;
}

.contact-item {
    display: flex;
    align-items: center;
    gap: 5px;
}

.contact-label {
    font-weight: bold;
    color: #555;
}

.contact-value {
    color: #7f8c8d;
}

.contact-link {
    color: #2c3e50;
    text-decoration: none;
}

.contact-link:hover {
    text-decoration: underline;
}
        .section {
            margin: 20px 0;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
            border-bottom: 1px solid #ecf0f1;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        .entry {
            margin: 10px 0;
        }
        .entry-title {
            font-weight: bold;
            font-size: 14px;
            display: flex;
            justify-content: space-between;

        }
        .entry-subtitle {
            color: #7f8c8d;
            font-style: italic;
            font-size: 12px;
        }
        .entry-description {
            margin-top: 5px;
            font-size: 13px;
        }

        .education-entry {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 10px;
        margin: 15px 0;
    }
    
    .education-degree {
        grid-column: 1;
        font-weight: bold;
        font-size: 14px;
    }
    
    .education-dates {
        grid-column: 2;
        grid-row: 1;
        font-size: 12px;
        color: #7f8c8d;
        text-align: right;
    }
    
    .education-institution {
        grid-column: 1 / -1;
        font-size: 13px;
        color: #555;
    }

    .language-entry {
    display: flex;
    gap: 10px;
    margin: 10px 0;
}

.language-name {
    font-weight: bold;
    font-size: 14px;
}

.language-level {
    font-size: 12px;
    color: #7f8c8d;
    text-align: right;
    display: flex;
    align-items: flex-end;
}
    .languages-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}
    </style>
</head>
<body>
    <div class="header">
        <div class="name">{{ full_name }}</div>
        <div>
          {{ quick_summary }}
        </div>
        <div class="contact">
        {% if email %}
            <div class="contact-item">
                <span class="contact-value">{{ email }}</span>
            </div>
        {% endif %}

        {% if phone_number %}
            <div class="contact-item">
                <span class="contact-value">{{ phone_number }}</span>
            </div>
        {% endif %}

        {% if city %}
            <div class="contact-item">
                <span class="contact-value">{{ city }}</span>
            </div>
        {% endif %}

        {% for link in links %}
            <div class="contact-item">
            <a href="{{ link.linkString }}" class="contact-link">{{ link.name }}</a>
            </div>
        {% endfor %}

    </div>
    </div>

    {% if professional_summary %}
    <div class="section">
        <div class="section-title">Podsumowanie</div>
        <p>{{ professional_summary }}</p>
    </div>
    {% endif %}
    

    {% if experience %}
    <div class="section">
        <div class="section-title">Doświadczenie Zawodowe</div>
        {% for job in experience %}
        <div class="entry">
            <div class="entry-title">
              <div>{{ job.position }}</div>
              <div class="entry-subtitle">{{ job.company }} | {{ job.start_date }} - {{ job.end_date }}</div>
            </div>
            <div class="entry-description">{{ job.description }}</div>
        </div>
        {% endfor %}
    </div>
    {% endif %}

    {% if education %}
    <div class="section">
      <div class="section-title">Edukacja</div>

      <div class="education-entry">
        {% for edu in education %}
          <div class="education-degree">{{ edu.major }}, {{edu.degree }}</div>
          <div class="education-dates">{{ edu.start_date }} - {{ edu.end_date }} </div>
          <div class="education-institution">{{ edu.school_name }}</div>
      </div>
      {% endfor %}
    </div>
    {% endif %}


    {% if skills %}
    <div class="section">
        <div class="section-title">Umiejętności</div>
        <p>{{ skills|join(', ') }}</p>
    </div>
    {% endif %}

    {% if certificates %}
    <div class="section">
        <div class="section-title">Certyfikaty</div>
        {% for cert in certificates %}
        <div class="education-entry">
            <div class="education-degree">{{ cert.name }}</div>
            <div class="education-dates">{{ cert.certification_date }}</div>
            <div class="education-institution">{{ cert.issuer }}</div>
        </div>
        {% endfor %}
    </div>
    {% endif %}

    {% if languages %}
        <div class="section">
            <div class="section-title">Języki</div>
            {% for lang in languages %}
            <div class="languages-grid">
                <div class="language-entry">
                    <div class="language-name">{{ lang.name }}</div>

                    <div class="language-level">{{ lang.level }}</div>
                </div>
            </div>
        </div>
    {% endif %}
</body>
</html>
"""

# def generate_cv_html(user_data: dict) -> str:
#     """Generuje HTML CV z danych użytkownika"""
#     template = Template(CV_TEMPLATE)
#     return template.render(**user_data)

# def generate_cv_pdf(user_data: dict) -> BytesIO:
#     """Generuje PDF CV"""
#     html_content = generate_cv_html(user_data)
#     pdf_bytes = BytesIO()
#     HTML(string=html_content).write_pdf(pdf_bytes)
#     pdf_bytes.seek(0)
#     return pdf_bytes

class CVService:
    def __init__(self):
        # Lokalne przechowywanie
        self.local_storage_path = Path(os.getenv("CV_STORAGE_PATH", "storage/cvs"))
        self.local_storage_path.mkdir(parents=True, exist_ok=True)
        
    def generate_cv_html(self, user_data: dict, job_offer: str = "") -> str:
        """Wygeneruj HTML CV na podstawie danych użytkownika"""
        
        template = Template(CV_TEMPLATE)
        
        # Jeśli jest job_offer, możesz dostosować CV
        return template.render(user=user_data, job_offer=job_offer)
    
    def html_to_pdf(self, html_content: str) -> bytes:
        """Konwertuj HTML na PDF"""
        pdf = fpdf.FPDF()
        pdf.add_page()
        pdf.write_html(html_content)
        # pdf_bytes = html.write_pdf()

        return bytes(pdf.output(dest="S"))
    
    def generate_cv_pdf(self, user_data: dict, job_offer: str = "") -> bytes:
        """Wygeneruj PDF CV z szablonu HTML"""
        html_content = self.generate_cv_html(user_data, job_offer)
        return self.html_to_pdf(html_content)
    
    async def save_pdf(self, user_id: str, task_id: str, pdf_bytes: bytes) -> str:
        """Przechowaj PDF lokalnie"""
        
        return await self._save_locally(user_id, task_id, pdf_bytes)
    
    async def _save_locally(self, user_id: str, task_id: str, pdf_bytes: bytes) -> str:
        """Przechowaj PDF lokalnie w strukturze: storage/cvs/YYYY/MM/user_id/task_id.pdf"""

        now = datetime.now(timezone.utc)
        user_dir = self.local_storage_path / str(now.year) / f"{now.month:02d}" / user_id
        user_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = user_dir / f"{task_id}.pdf"
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(pdf_bytes)
        
        return f"{now.year}/{now.month:02d}/{user_id}/{task_id}.pdf"
    

    async def get_pdf(self, pdf_path: str) -> bytes:
        """Pobierz PDF z lokalnego systemu lub chmury"""
        
        return await self._get_locally(pdf_path)
    
    async def _get_locally(self, pdf_path: str) -> bytes:
        """Pobierz PDF z dysku"""
        file_path = self.local_storage_path / pdf_path
        async with aiofiles.open(file_path, "rb") as f:
            return await f.read()

