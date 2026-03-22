import pytest
from pydantic import ValidationError
from app.schemas.user_preferences import (
  UserPreferencesCreate,
  UserPreferences,
  UserPreferencesResponse
)
from app.schemas.enums import SeniorityLevel, CountryCode


class TestUserPreferencesCreate:
  """Tests for UserPreferencesCreate"""
  
  def test_user_preferences_valid_data(self, sample_user_preferences):
    """UserPreferencesCreate accepts valid data"""
    prefs = UserPreferencesCreate(**sample_user_preferences)
    
    assert prefs.technology_slugs == ["python", "fastapi"]
    assert prefs.remote is True
    assert prefs.hybrid is False
    
  def test_user_preferences_all_optional(self):
    """All UserPreferencesCreate fields are optional"""
    prefs = UserPreferencesCreate()
    
    assert prefs.technology_slugs is None
    assert prefs.remote is None
    assert prefs.hybrid is None
  
  def test_user_preferences_seniority_validation_strings(self):
    """Seniority levels can be string"""
    prefs = UserPreferencesCreate(
      seniority_levels=["senior", "mid_level", "junior"]
    )
    
    assert prefs.seniority_levels == [
      SeniorityLevel.SENIOR,
      SeniorityLevel.MID,
      SeniorityLevel.JUNIOR
    ]
  
  def test_user_preferences_seniority_validation_enums(self):
    """Seniority levels can be enums"""
    prefs = UserPreferencesCreate(
      seniority_levels=[SeniorityLevel.SENIOR, SeniorityLevel.JUNIOR]
    )
    
    assert len(prefs.seniority_levels) == 2
    assert SeniorityLevel.SENIOR in prefs.seniority_levels
  
  def test_user_preferences_invalid_seniority(self):
    """Invalid seniority level raises error"""
    with pytest.raises(ValidationError):
      UserPreferencesCreate(seniority_levels=["invalid_level"])
  
  def test_user_preferences_countries_validation_strings(self):
    """Country codes can be strings"""
    prefs = UserPreferencesCreate(countries=["PL", "US", "DE"])
    
    assert prefs.countries == [
      CountryCode.PL,
      CountryCode.US,
      CountryCode.DE
    ]

  def test_user_preferences_countries_validation_enums(self):
    """Country codes can be enums"""
    prefs = UserPreferencesCreate(
      countries=[CountryCode.PL, CountryCode.US]
    )
    
    assert len(prefs.countries) == 2
  
  def test_user_preferences_invalid_country(self):
    """Invalid country code raises error"""
    with pytest.raises(ValidationError):
      UserPreferencesCreate(countries=["XX"])
  
  def test_user_preferences_mixed_types(self):
    """Possible enums and strings"""
    prefs = UserPreferencesCreate(
      countries=["PL", CountryCode.US],
      seniority_levels=["senior", SeniorityLevel.JUNIOR]
    )
    
    assert CountryCode.PL in prefs.countries
    assert SeniorityLevel.SENIOR in prefs.seniority_levels
  
  def test_user_preferences_partial_data(self):
    """UserPreferencesCreate accepts partial data"""
    prefs = UserPreferencesCreate(
      technology_slugs=["python"],
      remote=True
    )
    
    assert prefs.technology_slugs == ["python"]
    assert prefs.remote is True
    assert prefs.hybrid is None


class TestUserPreferences:
  """Tests for UserPreferences (with user_id)"""
  
  def test_user_preferences_with_id(self, sample_user_preferences):
    """UserPreferences requires user_id"""
    prefs = UserPreferences(**sample_user_preferences)
    
    assert prefs.user_id == "test_user_123"
  
  def test_user_preferences_missing_user_id(self):
    """UserPreferences requires user_id"""
    with pytest.raises(ValidationError):
      UserPreferences(technology_slugs=["python"])
  
  def test_user_preferences_serialization(self, sample_user_preferences):
    """UserPreferences can be serialized"""
    prefs = UserPreferences(**sample_user_preferences)
    data = prefs.model_dump()
    
    assert data["user_id"] == "test_user_123"
    assert "technology_slugs" in data


class TestUserPreferencesResponse:
  """Tests for UserPreferencesResponse"""
  
  def test_user_preferences_response_optional_id(self, sample_user_preferences):
    """UserPreferencesResponse - id is optional"""
    response = UserPreferencesResponse(**sample_user_preferences)
    
    assert response.user_id == "test_user_123"
    assert response.id is None
  
  def test_user_preferences_response_with_id(self, sample_user_preferences):
    """UserPreferencesResponse accepts id"""
    sample_user_preferences["id"] = "pref_123"
    
    response = UserPreferencesResponse(**sample_user_preferences)
    assert response.id == "pref_123"