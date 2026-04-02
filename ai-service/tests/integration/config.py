import os

# Test user data
TEST_USERS = {
  "user_1": {
    "id": os.getenv("TEST_USER_ID", "test-user-001"),
    "email": os.getenv("TEST_USER_EMAIL", "testuser1@example.com"),
  },
  "user_2": {
    "id": os.getenv("TEST_USER_2_ID", "test-user-002"),
    "email": os.getenv("TEST_USER_2_EMAIL", "testuser2@example.com"),
  },
}

# Service URLs
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8001")
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://localhost:5051")