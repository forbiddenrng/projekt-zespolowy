from app.core.celery_config import celery_app
# from app.services.cv_service import CVService
from app.services.cv_generation_service import CVGenerationService
from app.clients.userservice_client import UserServiceClient
from app.clients.mongodb_client import mongodb
from app.clients.openai_client import generate_cv_data
import asyncio
import os
from pathlib import Path
from datetime import datetime, timezone, timedelta

def get_time():
  return timezone(timedelta(hours=1))

class APIGenerationError(Exception):
  """Exception dla błędów generowania z API (format JSON, brakujące pola)"""
  pass



def _format_date(date_input) -> str:
  if not date_input:
    return ""
  
  try:
    if isinstance(date_input, datetime):
      return date_input.strftime("%d-%m-%Y")
    
    if isinstance(date_input, str):
      if not date_input.strip():
          return ""
      
      # Spróbuj ISO format first
      try:
        dt = datetime.fromisoformat(date_input.replace("T", " ").split(".")[0])
        return dt.strftime("%d-%m-%Y")
      except (ValueError, TypeError):
        pass

  except Exception as e:
    print(f"Error formatting date {date_input}: {e}")
  
  return ""


def _transform_education(education: list) -> list:
  """Transform education data"""
  transformed = []
  for edu in education:
    edu_item = {
        "degree": edu.get("degree", ""),
        "major": edu.get("major", ""),
        "school_name": edu.get("school_name", ""),
        "start_date": _format_date(edu.get("start_date", "")),
        "end_date": _format_date(edu.get("end_date")) if edu.get("end_date") else "Obecnie",
    }
    transformed.append(edu_item)
  return transformed


def _transform_experience(experience: list) -> list:
  """Transform experience data"""
  transformed = []
  for exp in experience:
    exp_item = {
        "position": exp.get("position", ""),
        "company": exp.get("company", ""),
        "start_date": _format_date(exp.get("start_date", "")),
        "end_date": _format_date(exp.get("end_date")) if exp.get("end_date") else "Obecnie",
        "description": exp.get("description", ""),
    }
    transformed.append(exp_item)
  return transformed


def _transform_certificates(certificates: list) -> list:
    """Transform certificates"""
    transformed = []
    for cert in certificates:
        cert_item = {
            "name": cert.get("name", ""),
            "certification_date": _format_date(cert.get("certification_date", "")),
            "issuer": cert.get("issuer", ""),
        }
        transformed.append(cert_item)
    return transformed

def _transform_languages(languages: list) -> list:
  """Transform languages data"""
  transformed = []
  for lang in languages:
    lang_item = {
      "name": lang.get("language", {}).get("name", ""),
      "level": lang.get("level", "")
    }
    transformed.append(lang_item)
  return transformed


def _transform_cv_data(generated_cv_data: dict, user_data: dict) -> dict:
  """Transform CV data"""
  return {
      "summary": generated_cv_data.get("summary", ""),
      "quick_summary": generated_cv_data.get("quick_summary", ""),
      "skills": [ability.get("name") for ability in user_data.get("abilities", [])],
      "languages": _transform_languages(user_data.get("user_languages", [])),
      "links": generated_cv_data.get("links", []),
      "certificates": _transform_certificates(user_data.get("certificates", [])),
      "experience": _transform_experience(user_data.get("work_experiences", [])),
      "education": _transform_education(user_data.get("education", [])),
  }


async def generate_cv_with_retry(user_data: dict, job_offer: str, max_retries: int = 3):
  """Generuj dane CV z polityką retry dla błędów API"""
  last_error = None
  
  for attempt in range(1, max_retries + 1):
    try:
      generated_data = await generate_cv_data(user_data, job_offer)
      return generated_data
    except ValueError as e:
      # ValueError jest zwracany gdy API zwróci zły format JSON
      last_error = e
      
      if attempt < max_retries:
        # retry after 3 seconds
        await asyncio.sleep(3)
        continue
      else:
        raise APIGenerationError(f"Failed to generate CV after {max_retries} attempts: {str(last_error)}")
    except Exception as e:
      # Inne błędy (np. błędy w aplikacji) nie ponawiaj
      print(f"Non-retriable error: {str(e)}")
      raise



@celery_app.task(bind=True, name="generate_cv_task")
def generate_cv_task(self, task_id: str, user_id: str, job_offer: str = ""):
  """Długotrwałe zadanie generowania CV"""
  
  
  # Uruchom event loop dla operacji async
  loop = asyncio.new_event_loop()
  asyncio.set_event_loop(loop)
    
  try:

    # connect with mongo
    loop.run_until_complete(mongodb.connect_db())

    # init services
    cv_gen_service = CVGenerationService()
    cv_service = CVService()
    user_client = UserServiceClient()

    # Zmień status na PROCESSING
    loop.run_until_complete(cv_gen_service.update_task_status(
      task_id, "PROCESSING", started_at=datetime.now(get_time())
    ))
    
    # Pobierz dane użytkownika
    user_data = loop.run_until_complete(user_client.get_user_data(user_id))

    try:
      # generuj dane do cv
      generated_cv_data = loop.run_until_complete(generate_cv_with_retry(user_data, job_offer,max_retries=3))
    except APIGenerationError as e:
      # change to failed
      loop.run_until_complete(cv_gen_service.update_task_status(
        task_id,
        "FAILED",
        error=f"Failed to generate CV data: {str(e)}"
      ))
      loop.run_until_complete(cv_gen_service.send_webhook(
        user_id, task_id, "FAILED"
      ))
      raise
    except Exception as e:
      # change to failed
      loop.run_until_complete(cv_gen_service.update_task_status(
        task_id,
        "FAILED",
        error=f"Failed to generate CV data: {str(e)}"
      ))
      loop.run_until_complete(cv_gen_service.send_webhook(
        user_id, task_id, "FAILED"
      ))
      raise

    transformed_cv_data = _transform_cv_data(generated_cv_data, user_data)

    cv_data = {
      "full_name": f"{user_data['name']} {user_data['surname']}",
      "email": user_data["email"],
      "phone_number": user_data["phone_number"],
      "city": user_data["city"],
      "summary": transformed_cv_data["summary"],
      "quick_summary": transformed_cv_data["quick_summary"],
      "links": transformed_cv_data["links"],
      "skills": transformed_cv_data["skills"],
      "languages": transformed_cv_data["languages"],
      "certificates": transformed_cv_data["certificates"],
      "experience": transformed_cv_data["experience"],
      "education": transformed_cv_data["education"],
    }

    
    # wygeneruj CV w HTML
    cv_html = cv_service.generate_cv_html(cv_data)
    
    # Przechowaj PDF
    pdf_path = loop.run_until_complete(
      cv_service.save_pdf(user_id, task_id, cv_html)
    )
      
    # Zaktualizuj status
    loop.run_until_complete(cv_gen_service.update_task_status(
        task_id,
        "COMPLETED",
        pdf_path=pdf_path,
        completed_at=datetime.now(get_time())
    ))
    
    # Wyślij webhook
    pdf_url = f"{os.getenv('API_BASE_URL')}/cv/{task_id}/download"
    loop.run_until_complete(cv_gen_service.send_webhook(
      user_id, task_id, "COMPLETED", pdf_url
    ))
      
  except Exception as e:
    cv_gen_service = CVGenerationService()
    
    loop.run_until_complete(cv_gen_service.update_task_status(
      task_id, "FAILED", error=str(e)
    ))
    loop.run_until_complete(cv_gen_service.send_webhook(
      user_id, task_id, "FAILED"
    ))
    raise
  finally:
    loop.run_until_complete(mongodb.close_db())
    loop.close()