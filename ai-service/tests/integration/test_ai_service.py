"""
Integration tests for AI service.
"""

import pytest
import requests
import time
from typing import Optional
from tests.integration.test_health import wait_for_services
from tests.integration.config import AI_SERVICE_URL, TEST_USERS


@pytest.mark.integration
class TestAIServiceJobOffers:
  """Test AI service job offers endpoints."""

  @pytest.fixture
  def user_id(self):
    return TEST_USERS[0]["id"]

  def test_get_job_offers(self, wait_for_services, user_id):
    """Test getting job offers."""
    headers = {"X-User": user_id}
    response = requests.get(
        f"{AI_SERVICE_URL}/api/jobs",
        headers=headers,
        timeout=10,
    )
    assert response.status_code == 200
    # Response should be a list or dict with data
    data = response.json()
    assert data is not None
    assert isinstance(data["data"], list)

@pytest.mark.integration
class TestAIServicePreferences:
  """Test AI service user preferences endpoints."""

  @pytest.fixture
  def user_id(self):
    return TEST_USERS[0]["id"]
  
  @pytest.fixture
  def user_2_id(self):
    return TEST_USERS[1]["id"]

  def test_get_user_preferences(self, wait_for_services, user_id):
    """Test getting user preferences.""" 
    headers = {"X-User": user_id}
    response = requests.get(
        f"{AI_SERVICE_URL}/api/preferences",
        headers=headers,
        timeout=10,
    )
    data = response.json()
    assert response.status_code == 200
    assert data is not None

  def test_get_user_preferences_not_found(self, wait_for_services):
    """Test getting user preferences."""
    headers = {"X-User": "not-a-user-id"}
    response = requests.get(
        f"{AI_SERVICE_URL}/api/preferences",
        headers=headers,
        timeout=10,
    )
    data = response.json()
    assert response.status_code == 404

  def test_create_user_preferences(self, wait_for_services, user_2_id):
    """Test creating user preferences."""
    preferences = {
        "technology_slugs": ["Python", "FastAPI", "MongoDB"],
        "seniority_levels": ["junior", "mid_level"],
        "remote": True,
        "hybrid": False,
        "countries": ["PL", "US"],
    }

    headers = {"X-User": user_2_id}
    response = requests.post(
        f"{AI_SERVICE_URL}/api/preferences",
        json=preferences,
        headers=headers,
        timeout=10,
    )
    data = response.json()
    assert response.status_code == 200

    response = requests.get(
        f"{AI_SERVICE_URL}/api/preferences",
        # json=preferences,
        headers=headers,
        timeout=10,
    )
    data = response.json()
    assert response.status_code == 200
    assert data["technology_slugs"] == ["Python", "FastAPI", "MongoDB"]
    assert data["seniority_levels"] == ["junior", "mid_level"]
    assert data["countries"] == ["PL", "US"]
    assert data["remote"] == True
    assert data["hybrid"] == False

  def test_create_user_preferences_wrong_fields(self, wait_for_services):
    """Test creating user preferences does not save wrong fields"""
    preferences = {
        "max_salary": 1000,
        "min_salary": 100
    }

    headers = {"X-User": "test-wrong-field"}
    response = requests.post(
        f"{AI_SERVICE_URL}/api/preferences",
        json=preferences,
        headers=headers,
        timeout=10,
    )
    data = response.json()
    assert response.status_code == 200

    response = requests.get(
        f"{AI_SERVICE_URL}/api/preferences",
        json=preferences,
        headers=headers,
        timeout=10,
    )
    data = response.json()
    assert response.status_code == 200
    assert data["technology_slugs"] is None
    assert data["seniority_levels"] is None
    assert data["countries"] is None
    assert data["remote"] is None
    assert data["hybrid"] is None
    assert "min_salary" not in data
    assert "max_salary" not in data

  def test_create_user_preferences_wrong_values(self, wait_for_services):
    """Test creating user preferences with wrong values return 422"""
    preferences = {
        "seniority_levels": ["mid", "expert"],
    }

    headers = {"X-User": "test-wrong-values"}
    response = requests.post(
        f"{AI_SERVICE_URL}/api/preferences",
        json=preferences,
        headers=headers,
        timeout=10,
    )
    data = response.json()
    assert response.status_code == 422

    response = requests.get(
        f"{AI_SERVICE_URL}/api/preferences",
        json=preferences,
        headers=headers,
        timeout=10,
    )
    data = response.json()
    assert response.status_code == 404 # profile is not created when wrong fields are given





