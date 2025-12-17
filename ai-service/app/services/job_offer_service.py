from typing import List, Optional
from datetime import datetime
from pymongo import UpdateOne
from motor.motor_asyncio import AsyncDatabase
from app.schemas.job_offer import JobOffer, JobOfferCreate
from app.clients.theirstack_client import theirstack_client

class JobOfferService:
  def __init__(self, db: AsyncDatabase):
    self.db = db
    self.collection = db["job_offers"]

  async def sync_job_offers(self, page: int = 1, limit: int = 50) -> int:
    """
    Pobierz oferty ogólnie (bez filtrowania po preferencjach).
    Będziemy pobierać co tydzień po 50 ofert, niezależnie od użytkowników.
    """
    try:
      offers_data = await theirstack_client.get_job_offers(page=page, limit=limit)
        
      if not offers_data:
        return 0

      operations = []
      for offer in offers_data:
        # Mapuj dane z API
        from app.schemas.job_offer import Company, Salary, Location
        
        company = Company(
          name=offer.get("company", {}).get("name", "Unknown"),
          country=offer.get("company", {}).get("country"),
          logo_url=offer.get("company", {}).get("logo_url")
        )
        
        salary = Salary(
          min_annual_salary=offer.get("salary", {}).get("min_annual_salary"),
          max_annual_salary=offer.get("salary", {}).get("max_annual_salary"),
          salary_currency=offer.get("salary", {}).get("currency")
        )
        
        location = [
          Location(
              country_name=loc.get("country_name"),
              display_name=loc.get("display_name")
          ) for loc in offer.get("location", [])
      ]
            
        job_offer = JobOfferCreate(
          external_id=offer.get("id"),
          title=offer.get("title"),
          company=company,
          location=location,
          description=offer.get("description"),
          salary=salary,
          source_url=offer.get("url"),
          employment_statuses=offer.get("employment_statuses", []),
          technology_slugs=offer.get("technology_slugs", []),
          remote=offer.get("remote"),
          hybrid=offer.get("hybrid"),
          seniority=offer.get("seniority"),
          date_posted=offer.get("date_posted")
        )
            
        operations.append(
            UpdateOne(
                {"external_id": job_offer.external_id},
                {
                    "$set": {
                        **job_offer.model_dump(),
                        "updated_at": datetime.now()
                    },
                    "$setOnInsert": {"created_at": datetime.now()}
                },
                upsert=True
            )
        )

      if operations:
        result = await self.collection.bulk_write(operations)
        return len(result.upserted_ids) + result.modified_count

      return 0

    except Exception as e:
      print(f"Error syncing job offers: {e}")
      raise

  async def get_offers_for_user(self, user_preferences: dict) -> List[dict]:
    """
    Pobierz oferty z bazy pasujące do preferencji użytkownika.
    To jest główna funkcja - użytkownicy ZAWSZE pobierają stąd.
    """
    query = {}

    # Filtruj po technologiach (jeśli wybrane)
    if user_preferences.get("technology_slugs"):
      query["technology_slugs"] = {
        "$in": user_preferences["technology_slugs"]
      }

    # Filtruj po remote
    if user_preferences.get("remote") is not None:
      query["remote"] = user_preferences["remote"]

    # Filtruj po hybrid
    if user_preferences.get("hybrid") is not None:
      query["hybrid"] = user_preferences["hybrid"]

    # Filtruj po seniority
    if user_preferences.get("seniority_levels"):
      query["seniority"] = {
        "$in": user_preferences["seniority_levels"]
      }

    # Filtruj po krajach
    if user_preferences.get("countries"):
      query["location.country_name"] = {
        "$in": user_preferences["countries"]
      }

    # Wyklucz firmy
    if user_preferences.get("excluded_companies"):
      query["company.name"] = {
        "$nin": user_preferences["excluded_companies"]
      }

    cursor = self.collection.find(query).sort("date_posted", -1)
    return await cursor.to_list(length=None)

  async def get_all_offers(self, skip: int = 0, limit: int = 20) -> List[dict]:
    """Pobierz wszystkie oferty (bez filtrowania)"""
    cursor = self.collection.find().skip(skip).limit(limit).sort("date_posted", -1)
    return await cursor.to_list(length=limit)

  async def count_offers(self) -> int:
    """Policz oferty"""
    return await self.collection.count_documents({})