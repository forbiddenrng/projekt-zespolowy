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

