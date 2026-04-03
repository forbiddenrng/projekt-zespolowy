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

  def test_get_user_profile_exists(self, wait_for_services, user_id):
    """Test getting user profile existence."""
    headers = {"x-user": json.dumps({"id": user_id})}
    response = requests.get(
        f"{USER_SERVICE_URL}/users/profile-exists",
        headers=headers,
        timeout=10,
    )
    print(USER_SERVICE_URL)
    data = response.json()
    print(data)
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
