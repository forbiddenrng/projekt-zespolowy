import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone, timedelta
from bson import ObjectId

from app.services.user_preferences import UserPreferencesService
from app.schemas.user_preferences import UserPreferencesCreate
from app.schemas.enums import SeniorityLevel, CountryCode

@pytest.mark.asyncio
class TestUserPreferencesService:
  """Test suite for UserPreferencesService class"""

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
    """Create UserPreferencesService instance with mocked database"""
    service = UserPreferencesService(mock_db["db"])
    return service

  @pytest.fixture
  def sample_preferences_data(self):
    """Sample user preferences for testing"""
    return UserPreferencesCreate(
        technology_slugs=["python", "fastapi"],
        remote=True,
        hybrid=False,
        seniority_levels=[SeniorityLevel.SENIOR, SeniorityLevel.MID],
        countries=[CountryCode.PL, CountryCode.DE]
    )
  
  @pytest.fixture
  def mock_prefs(self, sample_user_id):
    return {
      "_id": ObjectId(),
      "user_id": sample_user_id,
      "technology_slugs": ["python"],
      "remote": True,
      "hybrid": False,
      "seniority_levels": ["senior"],
      "countries": ["PL"]
    }

  @pytest.fixture
  def sample_user_id(self):
    """Sample user ID for testing"""
    return "user_12345"
  
  @pytest.fixture
  def mock_users(self):
    return [
      {
        "_id": ObjectId(),
        "user_id": "user_1",
        "technology_slugs": ["python"],
        "remote": True
      },
      {
        "_id": ObjectId(),
        "user_id": "user_2",
        "technology_slugs": ["javascript"],
        "remote": False
      },
      {
        "_id": ObjectId(),
        "user_id": "user_3",
        "technology_slugs": ["go"],
        "remote": True
      }
    ]
  

    # ===== save_preferences tests =====

  async def test_save_preferences_creates_new_document(self, service, sample_user_id, sample_preferences_data, mock_db):
    """Test that save_preferences creates a new user preferences document"""
    mock_db["collection"].update_one = AsyncMock(return_value=MagicMock(upserted_id=ObjectId()))

    result = await service.save_preferences(sample_user_id, sample_preferences_data)

    mock_db["collection"].update_one.assert_called_once()
    call_args = mock_db["collection"].update_one.call_args
    
    assert call_args[0][0] == {"user_id": sample_user_id}
    
    assert call_args[1]["upsert"] is True


  async def test_save_preferences_updates_existing_document(self, service, sample_user_id, sample_preferences_data, mock_db):
    """Test that save_preferences updates existing user preferences"""
    mock_db["collection"].update_one = AsyncMock(return_value=MagicMock(modified_count=1))

    result = await service.save_preferences(sample_user_id, sample_preferences_data)

    mock_db["collection"].update_one.assert_called_once()
    call_args = mock_db["collection"].update_one.call_args
    
    # Verify the update_one was called with correct parameters
    assert call_args[0][0] == {"user_id": sample_user_id}
    assert "$set" in call_args[0][1]
    assert "$setOnInsert" in call_args[0][1]

    assert call_args[1]["upsert"] is True


  async def test_save_preferences_includes_updated_at_timestamp(self, service, sample_user_id, sample_preferences_data, mock_db):
    """Test that save_preferences includes updated_at timestamp"""
    mock_db["collection"].update_one = AsyncMock(return_value=MagicMock())

    await service.save_preferences(sample_user_id, sample_preferences_data)

    call_args = mock_db["collection"].update_one.call_args
    update_doc = call_args[0][1]
    
    assert "updated_at" in update_doc["$set"]
    assert isinstance(update_doc["$set"]["updated_at"], datetime)


  async def test_save_preferences_includes_created_at_on_insert(self, service, sample_user_id, sample_preferences_data, mock_db):
    """Test that save_preferences includes created_at timestamp on insert"""
    mock_db["collection"].update_one = AsyncMock(return_value=MagicMock())

    await service.save_preferences(sample_user_id, sample_preferences_data)

    call_args = mock_db["collection"].update_one.call_args
    update_doc = call_args[0][1]
    
    assert "created_at" in update_doc["$setOnInsert"]
    assert isinstance(update_doc["$setOnInsert"]["created_at"], datetime)


  # ===== get_preferences tests =====

  async def test_get_preferences_returns_user_preferences(self, service, sample_user_id, mock_db, mock_prefs):
    """Test that get_preferences returns user preferences document"""
    mock_db["collection"].find_one = AsyncMock(return_value=mock_prefs)

    result = await service.get_preferences(sample_user_id)

    assert result is not None
    assert result["user_id"] == sample_user_id
    assert result["_id"] == str(mock_prefs["_id"])
    assert isinstance(result["_id"], str)
    mock_db["collection"].find_one.assert_called_once_with({"user_id": sample_user_id})

  async def test_get_preferences_returns_none_when_not_found(self, service, sample_user_id, mock_db):
    """Test that get_preferences returns None when user preferences not found"""
    mock_db["collection"].find_one = AsyncMock(return_value=None)

    result = await service.get_preferences(sample_user_id)

    assert result is None
    mock_db["collection"].find_one.assert_called_once_with({"user_id": sample_user_id})


# ===== get_all_users tests =====

  async def test_get_all_users_returns_list_of_users(self, service, mock_db, mock_users):
    """Test that get_all_users returns a list of all users with preferences"""
    
    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=mock_users)
    mock_db["collection"].find = MagicMock(return_value=mock_cursor)

    result = await service.get_all_users()

    assert isinstance(result, list)
    assert len(result) == 3
    mock_db["collection"].find.assert_called_once()


  async def test_get_all_users_converts_all_object_ids_to_strings(self, service, mock_db, mock_users):
    """Test that get_all_users converts all ObjectIds to strings"""

    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=mock_users)
    mock_db["collection"].find = MagicMock(return_value=mock_cursor)

    result = await service.get_all_users()

    for i, user in enumerate(result):
      assert isinstance(user["_id"], str)
      assert user["_id"] == str(mock_users[i]["_id"])


  async def test_get_all_users_returns_empty_list_when_no_users(self, service, mock_db):
    """Test that get_all_users returns empty list when no users found"""

    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=[])
    mock_db["collection"].find = MagicMock(return_value=mock_cursor)

    result = await service.get_all_users()

    assert isinstance(result, list)
    assert len(result) == 0


  async def test_get_all_users_calls_find_with_no_filters(self, service, mock_db):
    """Test that get_all_users calls find() without any filters"""

    mock_cursor = AsyncMock()
    mock_cursor.to_list = AsyncMock(return_value=[])
    mock_db["collection"].find = MagicMock(return_value=mock_cursor)

    await service.get_all_users()

    mock_db["collection"].find.assert_called_once_with()