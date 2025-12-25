from app.core.celery_config import celery_app
from app.services.cv_service import CVService
from app.services.cv_generation_service import CVGenerationService
from app.clients.userservice_client import UserServiceClient
from app.clients.mongodb_client import mongodb
from app.clients.openai_client import generate_cv_data
import asyncio
import os
from pathlib import Path
from datetime import datetime, timezone

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
      task_id, "PROCESSING", started_at=datetime.now(timezone.utc)
    ))
    
    # Pobierz dane użytkownika
    user_data = loop.run_until_complete(user_client.get_user_data(user_id))

    ## generuj dane do cv
    generated_cv_data = loop.run_until_complete(generate_cv_data(user_data, job_offer))

    cv_data = {
      "full_name": f"{user_data["name"]} {user_data["surname"]}",
      "email": user_data["email"],
      "phone_number": user_data["phone_number"],
      "city": user_data["city"],
      "professional_summary": generated_cv_data["professional_summary"],
      "quick_summary": generated_cv_data["quick_summary"],
      "links": generated_cv_data["links"],
      "skills": generated_cv_data["skills"],
      "languages": generated_cv_data["languages"],
      "certificates": generated_cv_data["certificates"],
      "experience": generated_cv_data["experience"],
      "education": generated_cv_data["education"],
    }

    
    # # wygeneruj CV w HTML
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
        completed_at=datetime.now(timezone.utc)
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