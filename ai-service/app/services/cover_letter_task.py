from app.core.celery_config import celery_app
from app.services.cover_letter_service import CoverLetterService
from app.services.cover_letter_generation_service import CoverLetterGenerationService
from app.clients.userservice_client import UserServiceClient
from app.clients.mongodb_client import mongodb
from app.clients.openai_client import generate_cover_letter_data
import asyncio
import os
from pathlib import Path
from datetime import datetime, timezone, timedelta

def get_time():
  return timezone(timedelta(hours=1))

@celery_app.task(bind=True, name="generate_cover_letter_task")
def generate_cover_letter_task(self, task_id: str, user_id: str, job_offer: str = "", company_info: str = ""):
  """Long process of generating covering letter"""
  
  # Uruchom event loop dla operacji async
  loop = asyncio.new_event_loop()
  asyncio.set_event_loop(loop)
    
  try:
    # connect with mongo
    loop.run_until_complete(mongodb.connect_db())

    # init services
    cover_letter_gen_service = CoverLetterGenerationService()
    cover_letter_service = CoverLetterService()
    user_client = UserServiceClient()

    # Zmień status na PROCESSING
    loop.run_until_complete(cover_letter_gen_service.update_task_status(
      task_id, "PROCESSING", started_at=datetime.now(get_time())
    ))
    
    # Pobierz dane użytkownika
    user_data = loop.run_until_complete(user_client.get_user_data(user_id))

    try:
      # generuj dane do listu motywacyjnego
      generated_cover_letter_data = loop.run_until_complete(generate_cover_letter_data(user_data, job_offer, company_info))
    except (ValueError, Exception) as e:
      print(f"ERROR: Cover letter generation failed: {e}")
      loop.run_until_complete(cover_letter_gen_service.update_task_status(
        task_id,
        "FAILED",
        error=f"Failed to generate cover letter data: {str(e)}"
      ))
      loop.run_until_complete(cover_letter_gen_service.send_webhook(
        user_id, task_id, "FAILED"
      ))
      raise

    cover_letter_data = {
      "full_name": f"{user_data['name']} {user_data['surname']}",
      "email": user_data["email"],
      "phone_number": user_data["phone_number"],
      "city": user_data["city"],
      "date": datetime.now(get_time()).strftime("%d.%m.%Y"),
      "introduction": generated_cover_letter_data["introduction"],
      "body": generated_cover_letter_data["body"],
      "closing": generated_cover_letter_data["closing"],
    }

    # wygeneruj list motywacyjny w HTML
    cover_letter_html = cover_letter_service.generate_cover_letter_html(cover_letter_data)
    
    # Przechowaj PDF
    pdf_path = loop.run_until_complete(
      cover_letter_service.save_pdf(user_id, task_id, cover_letter_html)
    )
      
    # Zaktualizuj status
    loop.run_until_complete(cover_letter_gen_service.update_task_status(
        task_id,
        "COMPLETED",
        pdf_path=pdf_path,
        completed_at=datetime.now(get_time())
    ))
    
    # Wyślij webhook
    pdf_url = f"{os.getenv('API_BASE_URL')}/cover-letter/{task_id}/download"
    loop.run_until_complete(cover_letter_gen_service.send_webhook(
        user_id, task_id, "COMPLETED", pdf_url
    ))
      
  except Exception as e:
    cover_letter_gen_service = CoverLetterGenerationService()
    
    loop.run_until_complete(cover_letter_gen_service.update_task_status(
      task_id, "FAILED", error=str(e)
    ))
    loop.run_until_complete(cover_letter_gen_service.send_webhook(
      user_id, task_id, "FAILED"
    ))
    raise
  finally:
    loop.run_until_complete(mongodb.close_db())
    loop.close()