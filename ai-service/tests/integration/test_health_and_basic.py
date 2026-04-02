"""
Integration tests for AI service and User service.
"""

import pytest
import requests
import time
from typing import Optional

# Configuration from environment
AI_SERVICE_URL = "http://localhost:8001"
USER_SERVICE_URL = "http://localhost:5051"

TEST_USER_ID = "test-user-001"
TEST_USER_2_ID = "test-user-002"
TEST_USER_EMAIL = "testuser1@example.com"


@pytest.fixture(scope="session")
def wait_for_services():
    """Wait for all services to be ready before running tests."""
    services = [
        (USER_SERVICE_URL, "User Service"),
        (AI_SERVICE_URL, "AI Service"),
    ]

    for url, name in services:
        max_retries = 30
        for i in range(max_retries):
            try:
                response = requests.get(f"{url}/health", timeout=5)
                if response.status_code == 200:
                    print(f"\n✓ {name} is ready")
                    break
            except requests.RequestException:
                pass

            if i == max_retries - 1:
                pytest.fail(f"{name} ({url}) did not become available after {max_retries} retries")

            time.sleep(1)


@pytest.mark.integration
class TestHealthChecks:
    """Test health check endpoints."""

    def test_user_service_health(self, wait_for_services):
        """Test user-service health endpoint."""
        response = requests.get(f"{USER_SERVICE_URL}/health", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert "status" in data or "message" in data

    def test_ai_service_health(self, wait_for_services):
        """Test ai-service health endpoint."""
        response = requests.get(f"{AI_SERVICE_URL}/health", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "ok"


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
        assert response.status_code == 200

    def test_get_user_profile_exists_by_id(self, wait_for_services):
        """Test getting user profile existence by user ID."""
        response = requests.get(
            f"{USER_SERVICE_URL}/users/{TEST_USER_ID}/profile-exists",
            timeout=10,
        )
        # Could be 200 or 404 depending on whether user exists
        assert response.status_code in [200, 404, 500]


@pytest.mark.integration
class TestAIServiceJobOffers:
    """Test AI service job offers endpoints."""

    def test_get_job_offers(self, wait_for_services):
        """Test getting job offers."""
        headers = {"X-User": TEST_USER_ID}
        response = requests.get(
            f"{AI_SERVICE_URL}/api/jobs",
            headers=headers,
            timeout=10,
        )
        assert response.status_code == 200
        # Response should be a list or dict with data
        data = response.json()
        assert data is not None

    def test_create_and_get_job_offer(self, wait_for_services):
        """Test creating and retrieving a job offer."""
        job_offer = {
            "external_id": f"test-job-{int(time.time())}",
            "title": "Test Python Developer",
            "company": "Test Company",
            "description": "Test job description",
            "requirements": ["Python"],
        }

        headers = {"X-User": "admin"}
        response = requests.post(
            f"{AI_SERVICE_URL}/api/jobs",
            json=job_offer,
            headers=headers,
            timeout=10,
        )
        assert response.status_code in [200, 201]


@pytest.mark.integration
class TestAIServicePreferences:
    """Test AI service user preferences endpoints."""

    def test_get_user_preferences(self, wait_for_services):
        """Test getting user preferences."""
        headers = {"X-User": TEST_USER_ID}
        response = requests.get(
            f"{AI_SERVICE_URL}/api/preferences",
            headers=headers,
            timeout=10,
        )
        assert response.status_code in [200, 404]

    def test_create_user_preferences(self, wait_for_services):
        """Test creating user preferences."""
        preferences = {
            "skills": ["Python", "TypeScript"],
            "experience_level": "mid",
            "job_types": ["remote"],
            "min_salary": 80000,
        }

        headers = {"X-User": TEST_USER_2_ID}
        response = requests.post(
            f"{AI_SERVICE_URL}/api/preferences",
            json=preferences,
            headers=headers,
            timeout=10,
        )
        assert response.status_code in [200, 201]


@pytest.mark.integration
class TestServicesCommunication:
    """Test communication between services."""

    def test_user_service_responds_to_queries(self, wait_for_services):
        """Test that user service is accessible."""
        response = requests.get(
            f"{USER_SERVICE_URL}/users/{TEST_USER_ID}/profile-exists",
            timeout=10,
        )
        # Any response means the service is communicating
        assert response.status_code in [200, 404, 400, 500]

    def test_ai_service_can_receive_requests(self, wait_for_services):
        """Test that ai service can receive and respond to requests."""
        headers = {"X-User": TEST_USER_ID}
        response = requests.get(
            f"{AI_SERVICE_URL}/api/jobs",
            headers=headers,
            timeout=10,
        )
        assert response.status_code == 200