import httpx
from typing import List, Dict, Any, Optional, Set
from app.core.config import settings

class ThirstackClient:
  def __init__(self):
    self.api_key = settings.THEIRSTACK_API_KEY
    self.base_url = settings.THEIRSTACK_API_URL
    self.headers = {
      "Authorization": f"Bearer {self.api_key}",
      "Content-Type": "application/json"
    }

  async def get_existing_offer_ids(self, db: Any) -> Set[int]:
    """Pobierz wszystkie external_id ofert już zapisanych w bazie"""
    collection = db["job_offers"]
    
    cursor = collection.find({}, {"external_id": 1})
    offers = await cursor.to_list(length=None)
    
    existing_ids = {offer["external_id"] for offer in offers}
    print(f"📊 Found {len(existing_ids)} existing offers in database")
    
    return existing_ids

  async def aggregate_user_preferences(self, db: Any) -> Dict[str, Any]:
    """Pobierz wszystkie preferencje użytkowników i zagreguj je"""
    collection = db["user_preferences"]
    
    cursor = collection.find()
    all_preferences = await cursor.to_list(length=None)
    
    if not all_preferences:
      return self._get_default_params()
    
    # Agreguj technologie
    all_technologies: Set[str] = set()
    for pref in all_preferences:
      techs = pref.get("technology_slugs") or []
      all_technologies.update(techs)
    
    # Agreguj remote
    remote_values = set()
    for pref in all_preferences:
      remote = pref.get("remote")
      if remote is not None:
        remote_values.add(remote)
    
    # Agreguj hybrid
    hybrid_values = set()
    for pref in all_preferences:
      hybrid = pref.get("hybrid")
      if hybrid is not None:
        hybrid_values.add(hybrid)
    
    # Agreguj seniority
    all_seniority_levels: Set[str] = set()
    for pref in all_preferences:
      seniority = pref.get("seniority_levels") or []
      all_seniority_levels.update(seniority)
    
    # Agreguj kraje
    all_countries: Set[str] = set()
    for pref in all_preferences:
      countries = pref.get("countries") or []
      all_countries.update(countries)
    
    remote = self._aggregate_boolean_preference(remote_values)
    hybrid = self._aggregate_boolean_preference(hybrid_values)
    
    return {
      "technology_slugs": list(all_technologies) if all_technologies else None,
      "remote": remote,
      "hybrid": hybrid,
      "seniority_levels": list(all_seniority_levels) if all_seniority_levels else None,
      "countries": list(all_countries) if all_countries else None
    }

  def _aggregate_boolean_preference(self, values: Set[bool]) -> Optional[bool]:
    """Agreguj preferencje boolean"""
    if not values:
      return None
    
    if len(values) == 2:
      return None
    
    return list(values)[0]

  def _get_default_params(self) -> Dict[str, Any]:
    """Domyślne parametry"""
    return {
      "technology_slugs": None,
      "remote": None,
      "hybrid": None,
      "seniority_levels": None,
      "countries": None
    }

  async def get_job_offers(self, 
                            db: Any,
                            page: int = 1,
                            limit: int = 50) -> List[Dict[str, Any]]:
    """Pobierz oferty pracy z Theirstack API"""
    try:
      aggregated_prefs = await self.aggregate_user_preferences(db)
      existing_ids = await self.get_existing_offer_ids(db)
      
      params = {
        "page": page,
        "limit": min(limit, 50)
      }
      
      if aggregated_prefs["technology_slugs"]:
        params["job_technology_slug_or"] = aggregated_prefs["technology_slugs"]
      
      if aggregated_prefs["remote"] is not None:
        params["remote"] = aggregated_prefs["remote"]
      
      if aggregated_prefs["hybrid"] is not None:
        params["hybrid"] = aggregated_prefs["hybrid"]
      
      if aggregated_prefs["seniority_levels"]:
        params["job_seniority_or"] = aggregated_prefs["seniority_levels"]
      
      if aggregated_prefs["countries"]:
        params["countries"] = aggregated_prefs["countries"]
      
      print(f"📤 Theirstack API Request: {params}")
      
      async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{self.base_url}/jobs",
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        data = response.json()
        
        all_offers = data.get("jobs", [])
        new_offers = [
            offer for offer in all_offers 
            if offer.get("id") not in existing_ids
        ]
        
        print(f"✓ API returned {len(all_offers)} offers, {len(new_offers)} are new")
        
        return new_offers
    
    except httpx.HTTPStatusError as e:
      print(f"✗ HTTP Error {e.response.status_code}: {e.response.text}")
      raise
    except Exception as e:
      print(f"✗ Error: {e}")
      raise

theirstack_client = ThirstackClient()