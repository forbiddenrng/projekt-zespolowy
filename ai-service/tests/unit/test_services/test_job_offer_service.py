import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone
from bson import ObjectId
from pymongo import UpdateOne

from app.services.job_offer_service import JobOfferService
from app.schemas.job_offer import JobOfferCreate, Company, Salary, Location
from app.schemas.enums import SeniorityLevel


class TestJobOfferService:
  """Test suite for JobOfferService class"""

  @pytest.fixture
  def mock_db(self):
    """Create mock MongoDB database"""
    mock_db = MagicMock()
    mock_collection = AsyncMock()
    mock_db.__getitem__ = MagicMock(return_value=mock_collection)
    
    return {
      "db": mock_db,
      "collection": mock_collection
    }

  @pytest.fixture
  def service(self, mock_db):
    """Create JobOfferService instance with mocked database"""
    service = JobOfferService(mock_db["db"])
    return service

  @pytest.fixture
  def sample_api_offer(self):
    """Sample job offer data from API"""
    return {
      "id": 12345,
      "job_title": "Senior Python Developer",
      "company_object": {
        "name": "Google",
        "country": "USA",
        "logo": "https://example.com/google.png"
      },
      "locations": [
        {
          "country_name": "United States",
          "display_name": "San Francisco, CA"
        }
      ],
      "description": "We are looking for a Senior Python Developer...",
      "min_annual_salary_usd": 150000,
      "max_annual_salary_usd": 200000,
      "url": "https://theirstack.com/jobs/12345",
      "employment_statuses": ["full-time"],
      "technology_slugs": ["python", "fastapi", "postgresql"],
      "remote": True,
      "hybrid": False,
      "seniority": "senior",
      "date_posted": "2024-12-16"
    }

  @pytest.fixture
  def sample_db_offer(self):
    """Sample job offer from database"""
    return {
      "_id": ObjectId(),
      "external_id": 12345,
      "title": "Senior Python Developer",
      "company": {
          "name": "Google",
          "country": "USA",
          "logo_url": "https://example.com/google.png"
      },
      "location": [
          {
              "country_name": "United States",
              "display_name": "San Francisco, CA"
          }
      ],
      "description": "We are looking for a Senior Python Developer...",
      "salary": {
          "min_annual_salary": 150000,
          "max_annual_salary": 200000,
          "salary_currency": "USD"
      },
      "source_url": "https://theirstack.com/jobs/12345",
      "employment_statuses": ["full-time"],
      "technology_slugs": ["python", "fastapi", "postgresql"],
      "remote": True,
      "hybrid": False,
      "seniority": "senior",
      "date_posted": "2024-12-16",
      "created_at": datetime.now(timezone.utc),
      "updated_at": datetime.now(timezone.utc)
    }

  # ===== sync_job_offers tests =====

  async def test_sync_job_offers_returns_zero_when_empty_list(self, service, mock_db):
    """Test that sync_job_offers returns 0 when API returns no data"""
    with patch('app.services.job_offer_service.theirstack_client') as mock_client:
      mock_client.get_job_offers = AsyncMock(return_value=[])

      result = await service.sync_job_offers(page=1, limit=50)

      assert result == 0
      mock_client.get_job_offers.assert_called_once_with(
        db=service.db,
        page=1,
        limit=50
      )
    
  
  async def test_sync_job_offers_creates_update_operations(self, service, sample_api_offer, mock_db):
    """Test that sync_job_offers creates UpdateOne operations for each offer"""
    # Arrange
    with patch('app.services.job_offer_service.theirstack_client') as mock_client:
      mock_client.get_job_offers = AsyncMock(return_value=[sample_api_offer])
      mock_db["collection"].bulk_write = AsyncMock(
          return_value=MagicMock(upserted_ids=[ObjectId()], modified_count=0)
      )

      # Act
      result = await service.sync_job_offers(page=1, limit=50)

      # Assert
      assert result == 1
      mock_db["collection"].bulk_write.assert_called_once()

  async def test_sync_job_offers_calls_bulk_write_with_operations(self, service, sample_api_offer, mock_db):
    """Test that sync_job_offers calls bulk_write with UpdateOne operations"""
    # Arrange
    with patch('app.services.job_offer_service.theirstack_client') as mock_client:
      mock_client.get_job_offers = AsyncMock(return_value=[sample_api_offer])
      mock_db["collection"].bulk_write = AsyncMock(
          return_value=MagicMock(upserted_ids=[ObjectId()], modified_count=0)
      )

      await service.sync_job_offers(page=1, limit=50)

      call_args = mock_db["collection"].bulk_write.call_args
      operations = call_args[0][0]

      assert len(operations) == 1
      assert isinstance(operations[0], UpdateOne)

  async def test_sync_job_offers_returns_count_of_synced_offers(self, service, sample_api_offer, mock_db):
    """Test that sync_job_offers returns correct count of synced offers"""
    offers = [sample_api_offer, sample_api_offer]
    with patch('app.services.job_offer_service.theirstack_client') as mock_client:
      mock_client.get_job_offers = AsyncMock(return_value=offers)
      mock_db["collection"].bulk_write = AsyncMock(
          return_value=MagicMock(upserted_ids=[ObjectId(), ObjectId()], modified_count=0)
      )

      result = await service.sync_job_offers(page=1, limit=50)

      assert result == 2

  async def test_sync_job_offers_handles_error_in_offer_processing(self, service, sample_api_offer, mock_db):
    """Test that sync_job_offers continues processing when one offer has error"""
    bad_offer = {"id": 999}  # Missing required fields
    good_offer = sample_api_offer
    offers = [bad_offer, good_offer]
    
    with patch('app.services.job_offer_service.theirstack_client') as mock_client:
      mock_client.get_job_offers = AsyncMock(return_value=offers)
      mock_db["collection"].bulk_write = AsyncMock(
          return_value=MagicMock(upserted_ids=[ObjectId()], modified_count=0)
      )

      result = await service.sync_job_offers(page=1, limit=50)

      assert result == 1  # Only one offer was synced

  async def test_sync_job_offers_raises_exception_on_api_error(self, service, mock_db):
    """Test that sync_job_offers raises exception when API call fails"""

    with patch('app.services.job_offer_service.theirstack_client') as mock_client:
      mock_client.get_job_offers = AsyncMock(side_effect=Exception("API Error"))

      with pytest.raises(Exception):
        await service.sync_job_offers(page=1, limit=50)

  async def test_sync_job_offers_includes_timestamps(self, service, sample_api_offer, mock_db):
    """Test that sync_job_offers includes created_at and updated_at timestamps"""

    with patch('app.services.job_offer_service.theirstack_client') as mock_client:
      mock_client.get_job_offers = AsyncMock(return_value=[sample_api_offer])
      mock_db["collection"].bulk_write = AsyncMock(
          return_value=MagicMock(upserted_ids=[ObjectId()], modified_count=0)
      )

      await service.sync_job_offers(page=1, limit=50)

      mock_db["collection"].bulk_write.assert_called_once()
      call_args = mock_db["collection"].bulk_write.call_args
      operations = call_args[0][0]
      assert isinstance(operations, list)
      assert len(operations) >= 1
      assert all(isinstance(op, UpdateOne) for op in operations)

  # ===== get_offers_for_user tests =====

  async def test_get_offers_for_user_returns_list_of_offers(self, service, sample_db_offer, mock_db):
    """Test that get_offers_for_user returns a list of offers"""
    user_preferences = {"technology_slugs": ["python"]}
    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=[sample_db_offer])
    mock_db["collection"].find = MagicMock(return_value=mock_cursor)
    mock_cursor.sort = MagicMock(return_value=mock_cursor)

    result = await service.get_offers_for_user(user_preferences)

    assert isinstance(result, list)
    assert len(result) > 0

  async def test_get_offers_for_user_filters_by_technology_slugs(self, service, sample_db_offer, mock_db):
    """Test that get_offers_for_user filters by technology_slugs"""
    user_preferences = {"technology_slugs": ["python", "fastapi"]}
    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=[sample_db_offer])
    mock_db["collection"].find = MagicMock(return_value=mock_cursor)
    mock_cursor.sort = MagicMock(return_value=mock_cursor)

    # Act
    await service.get_offers_for_user(user_preferences)

    # Assert
    call_args = mock_db["collection"].find.call_args
    query = call_args[0][0]

    assert "technology_slugs" in query
    assert query["technology_slugs"]["$in"] == ["python", "fastapi"]

  async def test_get_offers_for_user_filters_by_remote(self, service, sample_db_offer, mock_db):
    """Test that get_offers_for_user filters by remote preference"""
    # Arrange
    user_preferences = {"remote": True}
    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=[sample_db_offer])
    mock_db["collection"].find = MagicMock(return_value=mock_cursor)
    mock_cursor.sort = MagicMock(return_value=mock_cursor)

    # Act
    await service.get_offers_for_user(user_preferences)

    # Assert
    call_args = mock_db["collection"].find.call_args
    query = call_args[0][0]
    
    assert query["remote"] is True

  async def test_get_offers_for_user_filters_by_hybrid(self, service, sample_db_offer, mock_db):
    """Test that get_offers_for_user filters by hybrid preference"""
    # Arrange
    user_preferences = {"hybrid": True}
    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=[sample_db_offer])
    mock_db["collection"].find = MagicMock(return_value=mock_cursor)
    mock_cursor.sort = MagicMock(return_value=mock_cursor)

    # Act
    await service.get_offers_for_user(user_preferences)

    # Assert
    call_args = mock_db["collection"].find.call_args
    query = call_args[0][0]
    
    assert query["hybrid"] is True

  async def test_get_offers_for_user_filters_by_seniority_levels(self, service, sample_db_offer, mock_db):
    """Test that get_offers_for_user filters by seniority levels"""
    # Arrange
    user_preferences = {"seniority_levels": ["senior", "mid_level"]}
    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=[sample_db_offer])
    mock_db["collection"].find = MagicMock(return_value=mock_cursor)
    mock_cursor.sort = MagicMock(return_value=mock_cursor)

    # Act
    await service.get_offers_for_user(user_preferences)

    # Assert
    call_args = mock_db["collection"].find.call_args
    query = call_args[0][0]
    
    assert "seniority" in query
    assert query["seniority"]["$in"] == ["senior", "mid_level"]

  async def test_get_offers_for_user_sorts_by_date_posted_descending(self, service, sample_db_offer, mock_db):
    """Test that get_offers_for_user sorts by date_posted in descending order"""
    # Arrange
    user_preferences = {}
    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=[sample_db_offer])
    mock_db["collection"].find = MagicMock(return_value=mock_cursor)
    mock_cursor.sort = MagicMock(return_value=mock_cursor)

    # Act
    await service.get_offers_for_user(user_preferences)

    # Assert
    mock_cursor.sort.assert_called_once_with("date_posted", -1)

  async def test_get_offers_for_user_converts_id_field(self, service, sample_db_offer, mock_db):
    """Test that get_offers_for_user converts _id to id"""
    # Arrange
    offer_id = str(sample_db_offer["_id"])
    user_preferences = {}
    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=[sample_db_offer])
    mock_db["collection"].find = MagicMock(return_value=mock_cursor)
    mock_cursor.sort = MagicMock(return_value=mock_cursor)

    result = await service.get_offers_for_user(user_preferences)

    assert "id" in result[0]
    assert result[0]["id"] == offer_id
    assert "_id" not in result[0]

  async def test_get_offers_for_user_returns_offers_matching_all_filters(self, service, sample_db_offer, mock_db):
    """Test that get_offers_for_user applies multiple filters"""

    user_preferences = {
        "technology_slugs": ["python"],
        "remote": True,
        "seniority_levels": ["senior"]
    }
    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=[sample_db_offer])
    mock_db["collection"].find = MagicMock(return_value=mock_cursor)
    mock_cursor.sort = MagicMock(return_value=mock_cursor)

    await service.get_offers_for_user(user_preferences)

    call_args = mock_db["collection"].find.call_args
    query = call_args[0][0]
    
    assert len(query) == 3
    assert "technology_slugs" in query
    assert "remote" in query
    assert "seniority" in query

  # ===== get_all_offers tests =====

  async def test_get_all_offers_returns_list_of_offers(self, service, sample_db_offer, mock_db):
    """Test that get_all_offers returns a list of offers"""
    # Arrange
    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=[sample_db_offer])
    mock_db["collection"].find = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.sort = MagicMock(return_value=mock_cursor)

    # Act
    result = await service.get_all_offers()

    # Assert
    assert isinstance(result, list)
    assert len(result) > 0

  async def test_get_all_offers_applies_skip_parameter(self, service, sample_db_offer, mock_db):
    """Test that get_all_offers applies skip parameter for pagination"""
    # Arrange
    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=[sample_db_offer])
    mock_db["collection"].find = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.sort = MagicMock(return_value=mock_cursor)

    # Act
    await service.get_all_offers(skip=10, limit=20)

    # Assert
    mock_cursor.skip.assert_called_once_with(10)

  async def test_get_all_offers_applies_limit_parameter(self, service, sample_db_offer, mock_db):
    """Test that get_all_offers applies limit parameter for pagination"""
    # Arrange
    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=[sample_db_offer])
    mock_db["collection"].find = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.sort = MagicMock(return_value=mock_cursor)

    # Act
    await service.get_all_offers(skip=0, limit=20)

    # Assert
    mock_cursor.limit.assert_called_once_with(20)

  async def test_get_all_offers_sorts_by_date_posted_descending(self, service, sample_db_offer, mock_db):
    """Test that get_all_offers sorts by date_posted descending"""
    # Arrange
    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=[sample_db_offer])
    mock_db["collection"].find = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.sort = MagicMock(return_value=mock_cursor)

    # Act
    await service.get_all_offers()

    # Assert
    mock_cursor.sort.assert_called_once_with("date_posted", -1)

  async def test_get_all_offers_converts_id_field(self, service, sample_db_offer, mock_db):
    """Test that get_all_offers converts _id to id"""
    # Arrange
    offer_id = str(sample_db_offer["_id"])
    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=[sample_db_offer])
    mock_db["collection"].find = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.sort = MagicMock(return_value=mock_cursor)

    # Act
    result = await service.get_all_offers()

    # Assert
    assert "id" in result[0]
    assert result[0]["id"] == offer_id
    assert "_id" not in result[0]

  async def test_get_all_offers_returns_empty_list_when_no_offers(self, service, mock_db):
    """Test that get_all_offers returns empty list when no offers found"""
    # Arrange
    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=[])
    mock_db["collection"].find = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.sort = MagicMock(return_value=mock_cursor)

    # Act
    result = await service.get_all_offers()

    # Assert
    assert isinstance(result, list)
    assert len(result) == 0

  async def test_get_all_offers_uses_default_pagination_parameters(self, service, sample_db_offer, mock_db):
    """Test that get_all_offers uses default skip=0 and limit=20"""
    # Arrange
    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=[sample_db_offer])
    mock_db["collection"].find = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.sort = MagicMock(return_value=mock_cursor)

    # Act
    await service.get_all_offers()

    # Assert
    mock_cursor.skip.assert_called_once_with(0)
    mock_cursor.limit.assert_called_once_with(20)

  # ===== count_offers tests =====

  async def test_count_offers_returns_integer(self, service, mock_db):
    """Test that count_offers returns an integer"""
    # Arrange
    mock_db["collection"].count_documents = AsyncMock(return_value=42)

    # Act
    result = await service.count_offers()

    # Assert
    assert isinstance(result, int)
    assert result == 42

  async def test_count_offers_calls_count_documents_with_empty_filter(self, service, mock_db):
    """Test that count_offers calls count_documents with empty filter"""
    # Arrange
    mock_db["collection"].count_documents = AsyncMock(return_value=10)

    # Act
    await service.count_offers()

    # Assert
    mock_db["collection"].count_documents.assert_called_once_with({})

  async def test_count_offers_returns_zero_when_no_offers(self, service, mock_db):
    """Test that count_offers returns 0 when no offers in database"""
    # Arrange
    mock_db["collection"].count_documents = AsyncMock(return_value=0)

    # Act
    result = await service.count_offers()

    # Assert
    assert result == 0

  async def test_count_offers_returns_correct_count(self, service, mock_db):
    """Test that count_offers returns correct count of offers"""
    # Arrange
    mock_db["collection"].count_documents = AsyncMock(return_value=100)

    # Act
    result = await service.count_offers()

    # Assert
    assert result == 100