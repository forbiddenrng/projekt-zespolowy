import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.clients.mongodb_client import MongoDBClient, mongodb
from app.core.config import settings


class TestMongoDBClientConnect:
  """Test suite for MongoDB connection"""

  @pytest.mark.asyncio
  async def test_connect_db_success(self):
    """Test successful connection to MongoDB"""
    with patch('app.clients.mongodb_client.AsyncIOMotorClient') as mock_client_class:
      # Create mocks
      mock_client = AsyncMock()
      mock_db = MagicMock()
      mock_admin = AsyncMock()
      mock_collection = AsyncMock()
      
      # Setup mock chain
      mock_client_class.return_value = mock_client
      mock_client.admin = mock_admin
      mock_client.__getitem__ = MagicMock(return_value=mock_db)
      mock_admin.command = AsyncMock()
      mock_db.__getitem__ = MagicMock(return_value=mock_collection)
      
      # Reset class variables
      MongoDBClient.client = None
      MongoDBClient.db = None
      
      await MongoDBClient.connect_db()
      
      # Assertions
      mock_client_class.assert_called_once_with(settings.MONGODB_URL)
      mock_admin.command.assert_called_once_with('ping')
      mock_db.__getitem__.assert_called_once_with("job_offers")
      assert MongoDBClient.client is not None
      assert MongoDBClient.db is not None

  @pytest.mark.asyncio
  async def test_connect_db_creates_unique_index(self):
    """Test that connect_db creates unique index on external_id"""
    with patch('app.clients.mongodb_client.AsyncIOMotorClient') as mock_client_class:
      mock_client = AsyncMock()
      mock_db = MagicMock()
      mock_admin = AsyncMock()
      mock_collection = AsyncMock()
      
      mock_client_class.return_value = mock_client
      mock_client.admin = mock_admin
      mock_client.__getitem__ = MagicMock(return_value=mock_db)
      mock_admin.command = AsyncMock()
      mock_db.__getitem__ = MagicMock(return_value=mock_collection)
      mock_collection.create_index = AsyncMock()
      
      MongoDBClient.client = None
      MongoDBClient.db = None
      
      await MongoDBClient.connect_db()
      
      # Verify create_index was called with correct parameters
      mock_collection.create_index.assert_called_once_with(
          "external_id", 
          unique=True
      )

  @pytest.mark.asyncio
  async def test_connect_db_failure(self):
    """Test MongoDB connection failure"""
    with patch('app.clients.mongodb_client.AsyncIOMotorClient') as mock_client_class:
      mock_client = AsyncMock()
      mock_admin = AsyncMock()
      
      mock_client_class.return_value = mock_client
      mock_client.admin = mock_admin
      
      # Simulate connection error
      error = Exception("Connection refused")
      mock_admin.command = AsyncMock(side_effect=error)
      
      MongoDBClient.client = None
      MongoDBClient.db = None
      
      with pytest.raises(Exception) as exc_info:
          await MongoDBClient.connect_db()
      
      assert str(exc_info.value) == "Connection refused"
      # Client should still be set even if ping fails
      assert MongoDBClient.client is not None


class TestMongoDBClientDisconnect:
  """Test suite for MongoDB disconnection"""

  @pytest.mark.asyncio
  async def test_close_db_success(self):
    """Test successful disconnection from MongoDB"""
    mock_client = MagicMock()
    mock_client.close = MagicMock()
    
    MongoDBClient.client = mock_client
    
    await MongoDBClient.close_db()
    
    mock_client.close.assert_called_once()

  @pytest.mark.asyncio
  async def test_close_db_when_client_is_none(self):
    """Test close_db when client is None (no error should occur)"""
    MongoDBClient.client = None
    
    # Should not raise any exception
    await MongoDBClient.close_db()


class TestMongoDBClientGetDb:
  """Test suite for get_db method"""

  def test_get_db_returns_database(self):
    """Test that get_db returns the database instance"""
    mock_db = MagicMock()
    MongoDBClient.db = mock_db
    
    result = MongoDBClient.get_db()
    
    assert result is mock_db

  def test_get_db_returns_none_when_not_connected(self):
    """Test that get_db returns None when not connected"""
    MongoDBClient.db = None
    
    result = MongoDBClient.get_db()
    
    assert result is None


class TestMongoDBClientSingleton:
  """Test suite for mongodb singleton instance"""

  def test_mongodb_instance_exists(self):
    """Test that mongodb singleton instance is created"""
    assert mongodb is not None
    assert isinstance(mongodb, MongoDBClient)

  def test_mongodb_instance_is_mongodb_client(self):
    """Test that mongodb is an instance of MongoDBClient"""
    assert isinstance(mongodb, MongoDBClient)