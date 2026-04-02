"""
Integration tests for User service.
"""

import pytest
import requests
import time
from typing import Optional
from tests.integration.test_health import wait_for_services

# Configuration from environment
AI_SERVICE_URL = "http://localhost:8001"
USER_SERVICE_URL = "http://localhost:5051"

TEST_USER_ID = "test-user-001"
TEST_USER_2_ID = "test-user-002"
TEST_USER_EMAIL = "testuser1@example.com"

@pytest.mark.integration
class TestUserServiceIntegration:
    """Test user-service endpoints."""

    def test_get_user_profile_exists(self, wait_for_services):
        """Test getting user profile existence."""
        headers = {"x-user": TEST_USER_ID}
        response = requests.get(
            f"{USER_SERVICE_URL}/users/profile-exists",
            headers=headers,
            timeout=10,
        )
        data = response.json()
        assert response.status_code == 200
        assert data["data"] is not None
        assert isinstance(data["data"]["exists"], bool)

    def test_get_user_profile_exists_by_id(self, wait_for_services):
        """Test getting user profile existence by user ID."""
        response = requests.get(
            f"{USER_SERVICE_URL}/users/{TEST_USER_ID}/profile-exists",
            timeout=10,
        )

        data = response.json()
        assert response.status_code == 200
        assert data["data"] is not None
        assert isinstance(data["data"]["exists"], bool)
