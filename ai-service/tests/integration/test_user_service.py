"""
Integration tests for User service.
"""

import pytest
import requests
import time
from typing import Optional
import json
from tests.integration.test_health import wait_for_services
from tests.integration.config import AI_SERVICE_URL, USER_SERVICE_URL, TEST_USERS
from urllib.parse import quote

# Configuration from environment
# AI_SERVICE_URL = "http://localhost:8001"
# USER_SERVICE_URL = "http://localhost:5051"

# TEST_USER_ID = "test-user-001"
# TEST_USER_2_ID = "test-user-002"
# TEST_USER_EMAIL = "testuser1@example.com"

@pytest.mark.integration
class TestUserServiceIntegration:
  """Test user-service endpoints."""

  @pytest.fixture
  def user_id(self):
    return TEST_USERS[0]["id"]
  
  @pytest.fixture
  def delete_work_experience(self, user_id):
    headers = {"x-user": json.dumps({"id": user_id})}
    response = requests.put(
        f"{USER_SERVICE_URL}/users/work-experiences",
        headers=headers,
        json={"workExperiences": []},
        timeout=10,
    )


  def test_get_user_profile_exists(self, wait_for_services, user_id):
    """Test getting user profile existence."""
    headers = {"x-user": json.dumps({"id": user_id})}
    response = requests.get(
        f"{USER_SERVICE_URL}/users/profile-exists",
        headers=headers,
        timeout=10,
    )
    data = response.json()
    assert response.status_code == 200
    assert data["data"] is not None
    
    assert isinstance(data["data"]["exists"], bool)

  def test_get_user_profile_exists_by_id(self, wait_for_services, user_id):
    """Test getting user profile existence by user ID."""

    encoded_user_id = quote(user_id, safe='')

    response = requests.get(
        f"{USER_SERVICE_URL}/users/{encoded_user_id}/profile-exists",
        timeout=10,
    )

    data = response.json()
    assert response.status_code == 200
    assert data["data"] is not None
    assert isinstance(data["data"]["exists"], bool)



  def test_get_user_work_experience(self, wait_for_services, user_id):
    """Test getting user work experience from /users/work-experiences"""
    headers = {"x-user": json.dumps({"id": user_id})}
    response = requests.get(
        f"{USER_SERVICE_URL}/users/work-experiences",
        headers=headers,
        timeout=10,
    )
    data = response.json()
    assert response.status_code == 200
    assert data["data"] is not None
    assert isinstance(data["data"], list)

  def test_get_user_work_experience_nonexisting_user(self, wait_for_services, user_id):
    """Test getting user work experience from /users/work-experiences"""
    headers = {"x-user": json.dumps({"id": "nonexisting|id"})}
    response = requests.get(
        f"{USER_SERVICE_URL}/users/work-experiences",
        headers=headers,
        timeout=10,
    )
    data = response.json()
    assert response.status_code == 404


  def test_update_user_profile(self, wait_for_services, user_id):
    """Test updating user profile"""
    headers = {"x-user": json.dumps({"id": user_id})}
    response = requests.patch(
        f"{USER_SERVICE_URL}/users/me",
        headers=headers,
        json={
          "profileSummary": "New profile summary over 20 chars"
        },
        timeout=10,
    )
    data = response.json()
    assert response.status_code == 200

  def test_update_user_profile_wrong_field(self, wait_for_services, user_id):
    """Test updating user email - wrong field"""
    headers = {"x-user": json.dumps({"id": user_id})}
    response = requests.patch(
        f"{USER_SERVICE_URL}/users/me",
        headers=headers,
        json={
          "email": "newemail@email.com"
        },
        timeout=10,
    )
    data = response.json()
    assert response.status_code == 400

  def test_create_user_work_experience(self, wait_for_services, delete_work_experience, user_id):
    """Test creating user work experience"""
    headers = {"x-user": json.dumps({"id": user_id})}
    response = requests.put(
        f"{USER_SERVICE_URL}/users/work-experiences",
        headers=headers,
        json={
          "workExperiences": [{"companyName": "Example Company", "position": "Intern", "beginDate": "2026-01-01", "description": "Example work experience description"}]
        },
        timeout=10,
    )
    data = response.json()
    assert response.status_code == 200

    ## test integrity 
    response = requests.get(
        f"{USER_SERVICE_URL}/users/work-experiences",
        headers=headers,
        timeout=10,
    )
    data = response.json()
    assert data["data"][0]["company_name"] == "Example Company"


  def test_update_user_work_experience(self, wait_for_services, delete_work_experience, user_id):
    """Test updating user work experience from /users/work-experiences"""
    headers = {"x-user": json.dumps({"id": user_id})}
    response = requests.put(
        f"{USER_SERVICE_URL}/users/work-experiences",
        headers=headers,
        json={
          "workExperiences": [{"companyName": "Example Company", "position": "Intern", "beginDate": "2026-01-01", "description": "Example work experience description"}]
        },
        timeout=10,
    )
    data = response.json()
    assert response.status_code == 200
    work_id = data["data"][0]["id"]

    ## update 
    response = requests.put(
        f"{USER_SERVICE_URL}/users/work-experiences",
        headers=headers,
        json={
          "workExperiences": [{"id": work_id, "companyName": "Example Company New", "position": "Intern", "beginDate": "2026-01-01", "description": "Example work experience description"}]
        },
        timeout=10,
    )

    assert response.status_code == 200

    response = requests.get(
        f"{USER_SERVICE_URL}/users/work-experiences",
        headers=headers,
        timeout=10,
    )

    data = response.json()
    assert data["data"][0]["id"] == work_id
    assert data["data"][0]["company_name"] == "Example Company New"


