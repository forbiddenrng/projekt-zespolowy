import pytest
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Disable MongoDB connection during tests
import os
os.environ["MONGODB_URL"] = "mongodb://localhost:27017"
os.environ["MONGODB_DB"] = "test_ai_service"
os.environ["OPENROUTER_API_KEY"] = "test-key"
os.environ["OPENROUTER_MODEL"] = "test-model"
os.environ["OPENROUTER_URL"] = "https://test-api"


@pytest.fixture
def sample_job_offer_data():
  """Test data for job offer"""
  return {
    "external_id": 123,
    "title": "Senior Python Developer",
    "company": {
      "name": "Google",
      "country": "USA",
      "logo_url": "https://example.com/logo.png"
    },
    "location": [
      {
        "country_name": "United States",
        "display_name": "San Francisco, CA"
      }
    ],
    "description": "We are looking for...",
    "salary": {
        "min_annual_salary": 150000,
        "max_annual_salary": 200000,
        "salary_currency": "USD"
    },
    "source_url": "https://theirstack.com/jobs/123",
    "employment_statuses": ["full-time"],
    "technology_slugs": ["python", "fastapi"],
    "remote": True,
    "hybrid": False,
    "seniority": "senior",
    "date_posted": "2024-12-16"
}


@pytest.fixture
def sample_cv_data():
  """Test data for CV"""
  return {
    "name": "John Doe",
    "experience": "5 years in Python development",
    "skills": ["Python", "FastAPI", "PostgreSQL"]
  }


@pytest.fixture
def sample_user_preferences():
  """Test data for user preferences"""
  return {
      "user_id": "test_user_123",
      "technology_slugs": ["python", "fastapi"],
      "remote": True,
      "hybrid": False,
      "seniority_levels": ["senior", "mid_level"],
      "countries": ["PL", "US"]
  }