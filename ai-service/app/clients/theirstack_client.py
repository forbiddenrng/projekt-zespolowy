import httpx
from typing import List, Dict, Any, Optional, Set
from app.core.config import settings
from motor.motor_asyncio import AsyncDatabase

class ThirstackClient:
  def __init__(self):
    self.api_key = settings.THEIRSTACK_API_KEY
    self.base_url = settings.THEIRSTACK_API_URL
    self.headers = {
      "Authorization": f"Bearer {self.api_key}",
      "Content-Type": "application/json"
  }
    
  async def get_existing_offer_ids(self, db: AsyncDatabase) -> Set[int]:
    """
    Pobierz wszystkie external_id ofert już zapisanych w bazie.
    Zwraca set ID aby szybko sprawdzić czy oferta już istnieje.
    """
    collection = db["job_offers"]
    
    # Pobierz tylko external_id (najmniej danych)
    cursor = collection.find({}, {"external_id": 1})
    offers = await cursor.to_list(length=None)
    
    existing_ids = {offer["external_id"] for offer in offers}
    
    return existing_ids

  async def aggregate_user_preferences(self, db: AsyncDatabase) -> Dict[str, Any]:
    """
    Pobierz wszystkie preferencje użytkowników i zagreguj je.
    
    Logika:
    - Zbierz wszystkie technologie ze wszystkich użytkowników
    - Jeśli remote/hybrid mają MIESZANE wartości (true i false), ustaw na null
    - Jeśli wszyscy mają tę samą wartość, użyj tej wartości
    """
    collection = db["user_preferences"]
    
    # Pobierz wszystkie preferencje
    cursor = collection.find()
    all_preferences = await cursor.to_list(length=None)
    
    if not all_preferences:
      return self._get_default_params()
    
    # Agreguj technologie
    all_technologies: Set[str] = set()
    for pref in all_preferences:
      techs = pref.get("technology_slugs") or []
      all_technologies.update(techs)
    
    # Agreguj remote (True, False, None)
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
        
    # Agreguj seniority levels
    all_seniority_levels: Set[str] = set()
    for pref in all_preferences:
      seniority = pref.get("seniority_levels") or []
      all_seniority_levels.update(seniority)
        
    # Agreguj kraje
    all_countries: Set[str] = set()
    for pref in all_preferences:
      countries = pref.get("countries") or []
      all_countries.update(countries)
        
    # Logika: jeśli są MIESZANE wartości (True i False), ustaw None
    # W innym wypadku, jeśli wszyscy mają tę samą wartość, użyj jej
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
    """
    Agreguj preferencje boolean.
    
    Jeśli są MIESZANE (True i False) → zwróć None (pobieramy oba)
    Jeśli tylko True → zwróć True
    Jeśli tylko False → zwróć False
    Jeśli pusty set → zwróć None
    """
    if not values:
      return None
    
    if len(values) == 2:  # Mieszane: True i False
      return None
    
    return list(values)[0]  # Jeśli tylko jedna wartość

  def _get_default_params(self) -> Dict[str, Any]:
    """Domyślne parametry, gdy brak preferencji"""
    return {
      "technology_slugs": None,
      "remote": None,
      "hybrid": None,
      "seniority_levels": None,
      "countries": None
    }

  async def get_job_offers(self, 
                            db: AsyncDatabase,
                            page: int = 1,
                            limit: int = 50) -> List[Dict[str, Any]]:
    """
    Pobierz oferty pracy z Theirstack API na podstawie zagregowanych preferencji.
    
    Args:
        db: Połączenie do MongoDB
        page: Numer strony
        limit: Liczba ofert (max 50)
    
    Returns:
        Lista ofert pracy
    """
    try:
      # Agreguj preferencje wszystkich użytkowników
      aggregated_prefs = await self.aggregate_user_preferences(db)

      existring_ids = await self.get_existing_offer_ids(db)
      
      # Przygotuj parametry zapytania
      params = {
        "page": page,
        "limit": min(limit, 20),  # Max 20
        "posted_at_max_age_days": 30, ## ostatnie 30 dni
        "job_country_code_or": ["PL"], # oferty z Polski
        "job_id_not": existring_ids
      }
      
      # Dodaj technologie
      if aggregated_prefs["technology_slugs"]:
        params["job_technology_slug_or"] = aggregated_prefs["technology_slugs"]
      
      # Dodaj remote
      if aggregated_prefs["remote"] is not None:
        params["remote"] = aggregated_prefs["remote"]
      
      # Dodaj hybrid
      if aggregated_prefs["hybrid"] is not None:
        params["hybrid"] = aggregated_prefs["hybrid"]
      
      # Dodaj seniority
      if aggregated_prefs["job_seniority_or"]:
        params["seniority_levels"] = aggregated_prefs["seniority_levels"]
      
      print(f"Theirstack API Request Parameters: {params}")
      
      # Wyślij zapytanie do API
      # async with httpx.AsyncClient(timeout=30.0) as client:
      #   response = await client.get(
      #       f"{self.base_url}/jobs",
      #       headers=self.headers,
      #       params=params
      #   )
      #   response.raise_for_status()
      #   data = response.json()
        
      #   print(f"✓ Successfully fetched {len(data.get('jobs', []))} job offers")
      #   return data.get("jobs", [])
    
    except httpx.HTTPStatusError as e:
      print(f"HTTP Error {e.response.status_code}: {e.response.text}")
      raise
    except httpx.RequestError as e:
      print(f"Request Error: {e}")
      raise
    except Exception as e:
      print(f"Unexpected error: {e}")
      raise


  def print_aggregation_debug(self, prefs: Dict[str, Any]) -> str:
    """Debug helper - wyświetl jak wygląda agregacja"""
    return f"""
    Agregowane preferencje użytkowników:
    - Technologie: {prefs['technology_slugs']}
    - Remote: {prefs['remote']}
    - Hybrid: {prefs['hybrid']}
    - Seniority: {prefs['seniority_levels']}
    - Kraje: {prefs['countries']}
    """

theirstack_client = ThirstackClient()