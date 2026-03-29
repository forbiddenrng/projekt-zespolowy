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
os.environ["USER_SERVICE_URL"] = "http://localhost:8001"  
os.environ["THEIRSTACK_API_KEY"] = "test-theirstack-key"  
os.environ["THEIRSTACK_API_URL"] = "https://theirstack.com/v1"
os.environ["API_BASE_URL"] = "http://localhost:8000"

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone
from bson import ObjectId


@pytest.fixture
def mock_mongodb():
  """Mock MongoDB client"""
  mock_db = MagicMock()
  mock_collection = AsyncMock()

  mock_db.__getitem__ = MagicMock(return_value=mock_collection)

  return {
    "db": mock_db,
    "collection": mock_collection
  }

@pytest.fixture
def mock_mongodb_with_config_letter(mock_mongodb):
  """Patch mongodb client for cover letter service"""
  with patch('app.services.cover_letter_generation_service.mongodb') as mock:
    mock.db = mock_mongodb["db"]
    yield mock

@pytest.fixture
def mock_mongodb_with_config_cv(mock_mongodb):
  """Patch mongodb client for cover letter service"""
  with patch('app.services.cv_generation_service.mongodb') as mock:
    mock.db = mock_mongodb["db"]
    yield mock


@pytest.fixture
def sample_task_data():
  """Sample task data"""
  return {
      "_id": ObjectId(),
      "user_id": "user123",
      "job_offer": "Senior Python Developer",
      "status": "COMPLETED",
      "created_at": datetime.now(timezone.utc),
      "started_at": datetime.now(timezone.utc),
      "completed_at": datetime.now(timezone.utc),
      "pdf_path": "2026/01/user123/task123.pdf",
      "error": None,
  }


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

@pytest.fixture
def mock_aiofiles_open():
  """Factory for creating mock aiofiles.open async context manager"""
  def _create_mock(file_content = b''):
    mock_file = AsyncMock()
    mock_file.read = AsyncMock(return_value=file_content)

    async_cm = AsyncMock()
    async_cm.__aenter__ = AsyncMock(return_value=mock_file)
    async_cm.__aexit__ = AsyncMock(return_value=None)

    return async_cm, mock_file
  
  return _create_mock

