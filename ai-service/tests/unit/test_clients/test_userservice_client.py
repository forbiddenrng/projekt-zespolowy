import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import httpx

from app.clients.userservice_client import UserServiceClient


class TestUserServiceClient:
  """Test suite for UserServiceClient class"""

  @pytest.fixture
  def user_service_client(self):
    """Create UserServiceClient instance"""
    with patch.dict("os.environ", {"USER_SERVICE_URL": "http://localhost:8001"}):
      return UserServiceClient()

  @pytest.fixture
  def sample_user_data(self):
    """Sample user data response"""
    return {
      "id": "auth|069062915965377b1dfcf4fce",
      "name": "John Doe",
      "email": "john@example.com",
    }

  # ===== Initialization tests =====

  def test_init_sets_base_url(self, user_service_client):
    """Test that __init__ correctly sets base_url"""
    assert user_service_client.base_url == "http://localhost:8001"

  def test_init_strips_trailing_slash(self):
    """Test that __init__ strips trailing slash from base URL"""
    with patch.dict("os.environ", {"USER_SERVICE_URL": "http://localhost:8001/"}):
      client = UserServiceClient()
      assert client.base_url == "http://localhost:8001"
      assert not client.base_url.endswith("/")

  def test_init_sets_content_type_header(self, user_service_client):
    """Test that __init__ sets Content-Type header"""
    assert user_service_client.headers["Content-Type"] == "application/json"

  # ===== get_user_data successful response tests =====

  @pytest.mark.asyncio
  async def test_get_user_data_returns_user_data(
      self, user_service_client, sample_user_data
  ):
    """Test that get_user_data returns user data from response"""
    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.return_value = {"data": sample_user_data}

      mock_client = AsyncMock()
      mock_client.get = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_client

      result = await user_service_client.get_user_data("auth|069062915965377b1dfcf4fce")

      assert result == sample_user_data

  @pytest.mark.asyncio
  async def test_get_user_data_returns_response_if_no_data_key(
      self, user_service_client, sample_user_data
  ):
    """Test that get_user_data returns full response if 'data' key not present"""
    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.return_value = sample_user_data

      mock_client = AsyncMock()
      mock_client.get = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_client

      result = await user_service_client.get_user_data("auth|069062915965377b1dfcf4fce")

      assert result == sample_user_data

  @pytest.mark.asyncio
  async def test_get_user_data_encodes_user_id(
      self, user_service_client, sample_user_data
  ):
    """Test that get_user_data properly encodes user_id with quote()"""
    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.return_value = {"data": sample_user_data}

      mock_client = AsyncMock()
      mock_client.get = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_client

      # User ID with special characters
      user_id = "user+test@domain"
      await user_service_client.get_user_data(user_id)

      # Verify the URL was called with encoded user_id
      mock_client.get.assert_called_once()
      call_args = mock_client.get.call_args
      assert "user%2Btest%40domain" in call_args[0][0]

  @pytest.mark.asyncio
  async def test_get_user_data_uses_correct_url_format(
      self, user_service_client, sample_user_data
  ):
    """Test that get_user_data calls correct endpoint URL"""
    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.return_value = {"data": sample_user_data}

      mock_client = AsyncMock()
      mock_client.get = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_client

      await user_service_client.get_user_data("test123")

      expected_url = "http://localhost:8001/users/test123?all=true"
      mock_client.get.assert_called_once_with(
          expected_url,
          headers={"Content-Type": "application/json"}
      )

  @pytest.mark.asyncio
  async def test_get_user_data_passes_headers(
      self, user_service_client, sample_user_data
  ):
    """Test that get_user_data passes correct headers"""
    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.return_value = {"data": sample_user_data}

      mock_client = AsyncMock()
      mock_client.get = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_client

      await user_service_client.get_user_data("test123")

      call_kwargs = mock_client.get.call_args[1]
      assert call_kwargs["headers"]["Content-Type"] == "application/json"

  @pytest.mark.asyncio
  async def test_get_user_data_uses_timeout(self, user_service_client, sample_user_data):
    """Test that get_user_data uses 10 second timeout"""
    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.return_value = {"data": sample_user_data}

      mock_client = AsyncMock()
      mock_client.get = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_client

      await user_service_client.get_user_data("test123")

      # Verify AsyncClient was instantiated with timeout=10
      mock_client_class.assert_called_once_with(timeout=10)

  # ===== Error handling tests =====

  @pytest.mark.asyncio
  async def test_get_user_data_raises_on_http_status_error(
      self, user_service_client
  ):
    """Test that get_user_data raises HTTPStatusError when response status is error"""
    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.status_code = 404
      mock_response.text = "User not found"

      error = httpx.HTTPStatusError(
          message="404 Not Found",
          request=MagicMock(),
          response=mock_response
      )

      mock_client = AsyncMock()
      mock_client.get = AsyncMock(side_effect=error)
      mock_client_class.return_value.__aenter__.return_value = mock_client

      with pytest.raises(httpx.HTTPStatusError):
        await user_service_client.get_user_data("test123")

  @pytest.mark.asyncio
  async def test_get_user_data_raises_on_http_500_error(
      self, user_service_client
  ):
    """Test that get_user_data raises on server error"""
    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.status_code = 500
      mock_response.text = "Internal Server Error"

      error = httpx.HTTPStatusError(
          message="500 Internal Server Error",
          request=MagicMock(),
          response=mock_response
      )

      mock_client = AsyncMock()
      mock_client.get = AsyncMock(side_effect=error)
      mock_client_class.return_value.__aenter__.return_value = mock_client

      with pytest.raises(httpx.HTTPStatusError):
        await user_service_client.get_user_data("test123")

  @pytest.mark.asyncio
  async def test_get_user_data_raises_on_general_exception(
      self, user_service_client
  ):
    """Test that get_user_data raises general exceptions"""
    with patch("httpx.AsyncClient") as mock_client_class:
      mock_client = AsyncMock()
      mock_client.get = AsyncMock(side_effect=ConnectionError("Connection failed"))
      mock_client_class.return_value.__aenter__.return_value = mock_client

      with pytest.raises(ConnectionError):
        await user_service_client.get_user_data("test123")

  @pytest.mark.asyncio
  async def test_get_user_data_raises_on_json_decode_error(
      self, user_service_client
  ):
    """Test that get_user_data raises on invalid JSON response"""
    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.side_effect = ValueError("Invalid JSON")

      mock_client = AsyncMock()
      mock_client.get = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_client

      with pytest.raises(ValueError):
        await user_service_client.get_user_data("test123")

  # ===== Edge cases =====

  @pytest.mark.asyncio
  async def test_get_user_data_handles_empty_user_id(
      self, user_service_client, sample_user_data
  ):
    """Test that get_user_data handles empty user_id"""
    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.return_value = {"data": sample_user_data}

      mock_client = AsyncMock()
      mock_client.get = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_client

      await user_service_client.get_user_data("")

      expected_url = "http://localhost:8001/users/?all=true"
      mock_client.get.assert_called_once()

  @pytest.mark.asyncio
  async def test_get_user_data_handles_special_characters_in_user_id(
        self, user_service_client, sample_user_data
    ):
    """Test that special characters in user_id are properly encoded"""
    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.return_value = {"data": sample_user_data}

      mock_client = AsyncMock()
      mock_client.get = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_client

      special_user_id = "user/id#123"
      await user_service_client.get_user_data(special_user_id)

      call_url = mock_client.get.call_args[0][0]
      # Verify that special characters are encoded
      assert "user%2Fid%23123" in call_url