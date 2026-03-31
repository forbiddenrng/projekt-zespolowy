import pytest
from unittest.mock import AsyncMock, MagicMock, patch, call
import httpx
from typing import Set, Dict, Any, List

from app.clients.theirstack_client import TheirstackClient


class TestTheirstackClientInit:
  """Test suite for TheirstackClient initialization"""

  def test_init_sets_api_key(self):
    """Test that __init__ correctly sets api_key"""
    with patch("app.core.config.settings") as mock_config:      
      client = TheirstackClient()
      assert client.api_key == "test-theirstack-key" # from conftest env

  def test_init_sets_base_url(self):
    """Test that __init__ correctly sets base_url"""
    with patch("app.core.config.settings") as mock_config:
      client = TheirstackClient()
      assert client.base_url == "https://theirstack.com/v1" # from conftest env

  def test_init_sets_authorization_header(self):
    """Test that __init__ sets Authorization header with Bearer token"""
    with patch("app.core.config.settings") as mock_config:
      client = TheirstackClient()
      assert client.headers["Authorization"] == "Bearer test-theirstack-key"

  def test_init_sets_content_type_header(self):
    """Test that __init__ sets Content-Type header"""
    with patch("app.core.config.settings") as mock_config:
      client = TheirstackClient()
      assert client.headers["Content-Type"] == "application/json"


class TestGetExistingOfferIds:
  """Test suite for get_existing_offer_ids method"""

  @pytest.fixture
  def client(self):
    with patch("app.core.config.settings") as mock_config:
      yield TheirstackClient()

  @pytest.mark.asyncio
  async def test_get_existing_offer_ids_returns_set_of_ids(self, client):
    """Test that get_existing_offer_ids returns set of external_id values"""
    # Mock database
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_cursor = AsyncMock()
    
    offers = [
        {"external_id": 1},
        {"external_id": 2},
        {"external_id": 3}
    ]
    mock_cursor.to_list.return_value = offers
    mock_collection.find.return_value = mock_cursor
    mock_db.__getitem__.return_value = mock_collection

    result = await client.get_existing_offer_ids(mock_db)

    assert isinstance(result, set)
    assert result == {1, 2, 3}

  @pytest.mark.asyncio
  async def test_get_existing_offer_ids_returns_empty_set(self, client):
    """Test that get_existing_offer_ids returns empty set when no offers exist"""
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_cursor = AsyncMock()
    
    mock_cursor.to_list.return_value = []
    mock_collection.find.return_value = mock_cursor
    mock_db.__getitem__.return_value = mock_collection

    result = await client.get_existing_offer_ids(mock_db)

    assert result == set()

  @pytest.mark.asyncio
  async def test_get_existing_offer_ids_queries_job_offers_collection(self, client):
    """Test that get_existing_offer_ids queries job_offers collection"""
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_cursor = AsyncMock()
    
    mock_cursor.to_list.return_value = []
    mock_collection.find.return_value = mock_cursor
    mock_db.__getitem__.return_value = mock_collection

    await client.get_existing_offer_ids(mock_db)

    mock_db.__getitem__.assert_called_once_with("job_offers")

  @pytest.mark.asyncio
  async def test_get_existing_offer_ids_uses_projection(self, client):
    """Test that get_existing_offer_ids uses projection for external_id"""
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_cursor = AsyncMock()
    
    mock_cursor.to_list.return_value = []
    mock_collection.find.return_value = mock_cursor
    mock_db.__getitem__.return_value = mock_collection

    await client.get_existing_offer_ids(mock_db)

    mock_collection.find.assert_called_once_with({}, {"external_id": 1})


class TestAggregateBooleanPreference:
  """Test suite for _aggregate_boolean_preference method"""

  @pytest.fixture
  def client(self):
    with patch("app.core.config.settings") as mock_config:
      yield TheirstackClient()

  def test_aggregate_boolean_preference_empty_set(self, client):
    """Test that empty set returns None"""
    result = client._aggregate_boolean_preference(set())
    assert result is None

  def test_aggregate_boolean_preference_single_true(self, client):
    """Test that single True value returns True"""
    result = client._aggregate_boolean_preference({True})
    assert result is True

  def test_aggregate_boolean_preference_single_false(self, client):
    """Test that single False value returns False"""
    result = client._aggregate_boolean_preference({False})
    assert result is False

  def test_aggregate_boolean_preference_mixed_returns_none(self, client):
    """Test that mixed True and False values return None"""
    result = client._aggregate_boolean_preference({True, False})
    assert result is None

  def test_aggregate_boolean_preference_multiple_true(self, client):
    """Test that multiple True values return True"""
    result = client._aggregate_boolean_preference({True, True})
    assert result is True


class TestGetDefaultParams:
  """Test suite for _get_default_params method"""

  @pytest.fixture
  def client(self):
    with patch("app.core.config.settings") as mock_config:
      yield TheirstackClient()

  def test_get_default_params_returns_dict(self, client):
    """Test that _get_default_params returns a dictionary"""
    result = client._get_default_params()
    assert isinstance(result, dict)

  def test_get_default_params_has_all_keys(self, client):
    """Test that default params has all required keys"""
    result = client._get_default_params()
    expected_keys = {
        "technology_slugs",
        "remote",
        "hybrid",
        "seniority_levels",
        "countries"
    }
    assert set(result.keys()) == expected_keys

  def test_get_default_params_all_values_none(self, client):
    """Test that all default values are None"""
    result = client._get_default_params()
    for value in result.values():
      assert value is None


class TestAggregateUserPreferences:
  """Test suite for aggregate_user_preferences method"""

  @pytest.fixture
  def client(self):
    with patch("app.core.config.settings") as mock_config:
      yield TheirstackClient()

  @pytest.mark.asyncio
  async def test_aggregate_user_preferences_returns_default_when_empty(self, client):
    """Test that empty preferences return default params"""
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_cursor = AsyncMock()
    
    mock_cursor.to_list.return_value = []
    mock_collection.find.return_value = mock_cursor
    mock_db.__getitem__.return_value = mock_collection

    result = await client.aggregate_user_preferences(mock_db)

    expected = {
      "technology_slugs": None,
      "remote": None,
      "hybrid": None,
      "seniority_levels": None,
      "countries": None
    }
    assert result == expected

  @pytest.mark.asyncio
  async def test_aggregate_user_preferences_aggregates_technologies(self, client):
    """Test that technologies are aggregated from all preferences"""
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_cursor = AsyncMock()
    
    preferences = [
        {"technology_slugs": ["python", "django"]},
        {"technology_slugs": ["python", "fastapi"]},
        {"technology_slugs": ["nodejs"]}
    ]
    mock_cursor.to_list.return_value = preferences
    mock_collection.find.return_value = mock_cursor
    mock_db.__getitem__.return_value = mock_collection

    result = await client.aggregate_user_preferences(mock_db)

    assert set(result["technology_slugs"]) == {"python", "django", "fastapi", "nodejs"}

  @pytest.mark.asyncio
  async def test_aggregate_user_preferences_aggregates_seniority(self, client):
    """Test that seniority levels are aggregated"""
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_cursor = AsyncMock()
    
    preferences = [
        {"seniority_levels": ["junior", "mid"]},
        {"seniority_levels": ["mid", "senior"]},
    ]
    mock_cursor.to_list.return_value = preferences
    mock_collection.find.return_value = mock_cursor
    mock_db.__getitem__.return_value = mock_collection

    result = await client.aggregate_user_preferences(mock_db)

    assert set(result["seniority_levels"]) == {"junior", "mid", "senior"}

  @pytest.mark.asyncio
  async def test_aggregate_user_preferences_aggregates_countries(self, client):
    """Test that countries are aggregated"""
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_cursor = AsyncMock()
    
    preferences = [
        {"countries": ["PL", "DE"]},
        {"countries": ["DE", "FR"]},
    ]
    mock_cursor.to_list.return_value = preferences
    mock_collection.find.return_value = mock_cursor
    mock_db.__getitem__.return_value = mock_collection

    result = await client.aggregate_user_preferences(mock_db)

    assert set(result["countries"]) == {"PL", "DE", "FR"}

  @pytest.mark.asyncio
  async def test_aggregate_user_preferences_aggregates_remote_true(self, client):
    """Test that remote=True is aggregated correctly"""
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_cursor = AsyncMock()
    
    preferences = [
        {"remote": True},
        {"remote": True},
    ]
    mock_cursor.to_list.return_value = preferences
    mock_collection.find.return_value = mock_cursor
    mock_db.__getitem__.return_value = mock_collection

    result = await client.aggregate_user_preferences(mock_db)

    assert result["remote"] is True

  @pytest.mark.asyncio
  async def test_aggregate_user_preferences_aggregates_remote_mixed_returns_none(self, client):
    """Test that mixed remote values return None"""
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_cursor = AsyncMock()
    
    preferences = [
        {"remote": True},
        {"remote": False},
    ]
    mock_cursor.to_list.return_value = preferences
    mock_collection.find.return_value = mock_cursor
    mock_db.__getitem__.return_value = mock_collection

    result = await client.aggregate_user_preferences(mock_db)

    assert result["remote"] is None

  @pytest.mark.asyncio
  async def test_aggregate_user_preferences_handles_missing_keys(self, client):
    """Test that missing keys are handled gracefully"""
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_cursor = AsyncMock()
    
    preferences = [
        {"technology_slugs": ["python"]},
        {"remote": True},
        {"countries": ["PL"]}
    ]
    mock_cursor.to_list.return_value = preferences
    mock_collection.find.return_value = mock_cursor
    mock_db.__getitem__.return_value = mock_collection

    result = await client.aggregate_user_preferences(mock_db)

    assert result["technology_slugs"] == ["python"]
    assert result["remote"] is True
    assert result["countries"] == ["PL"]
    assert result["seniority_levels"] is None
    assert result["hybrid"] is None


class TestGetJobOffers:
  """Test suite for get_job_offers method"""

  @pytest.fixture
  def client(self):
    with patch("app.core.config.settings") as mock_config:
      yield TheirstackClient()

  @pytest.fixture
  def sample_offers(self):
    return [
      {"id": 1, "title": "Python Developer", "company": "Company A"},
      {"id": 2, "title": "Node.js Developer", "company": "Company B"},
      {"id": 3, "title": "Java Developer", "company": "Company C"}
    ]

  def _create_mock_db(self, existing_ids: Set[int] = None, preferences: Dict = None):
    """Helper to create mock database"""
    mock_db = MagicMock()
    
    # Mock job_offers collection
    job_offers_collection = MagicMock()
    job_offers_cursor = AsyncMock()
    job_offers_cursor.to_list.return_value = [
        {"external_id": eid} for eid in (existing_ids or set())
    ]
    job_offers_collection.find.return_value = job_offers_cursor
    
    # Mock user_preferences collection
    prefs_collection = MagicMock()
    prefs_cursor = AsyncMock()
    prefs_cursor.to_list.return_value = [preferences] if preferences else []
    prefs_collection.find.return_value = prefs_cursor
    
    def get_item(key):
      if key == "job_offers":
        return job_offers_collection
      elif key == "user_preferences":
        return prefs_collection
    
    mock_db.__getitem__.side_effect = get_item
    return mock_db

  @pytest.mark.asyncio
  async def test_get_job_offers_returns_new_offers(self, client, sample_offers):
    """Test that get_job_offers returns new offers"""
    existing_ids = {1}
    mock_db = self._create_mock_db(existing_ids)

    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.return_value = {"data": sample_offers}

      mock_http_client = AsyncMock()
      mock_http_client.post = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_http_client

      result = await client.get_job_offers(mock_db)

      print(result)

      # Should return offers that are not in existing_ids
      assert len(result) == 2
      assert result[0]["id"] == 2
      assert result[1]["id"] == 3

  @pytest.mark.asyncio
  async def test_get_job_offers_uses_correct_timeout(self, client, sample_offers):
    """Test that get_job_offers uses 30 second timeout"""
    mock_db = self._create_mock_db(set())

    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.return_value = {"data": sample_offers}

      mock_http_client = AsyncMock()
      mock_http_client.post = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_http_client

      await client.get_job_offers(mock_db)

      mock_client_class.assert_called_once_with(timeout=30.0)

  @pytest.mark.asyncio
  async def test_get_job_offers_makes_post_request(self, client, sample_offers):
    """Test that get_job_offers makes POST request"""
    mock_db = self._create_mock_db(set())

    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.return_value = {"data": sample_offers}

      mock_http_client = AsyncMock()
      mock_http_client.post = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_http_client

      await client.get_job_offers(mock_db)

      mock_http_client.post.assert_called_once()
      call_args = mock_http_client.post.call_args
      assert call_args[0][0] == "https://theirstack.com/v1" # from conftest env

  @pytest.mark.asyncio
  async def test_get_job_offers_sends_authorization_header(self, client, sample_offers):
    """Test that get_job_offers sends correct headers"""
    mock_db = self._create_mock_db(set())

    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.return_value = {"data": sample_offers}

      mock_http_client = AsyncMock()
      mock_http_client.post = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_http_client

      await client.get_job_offers(mock_db)

      call_kwargs = mock_http_client.post.call_args[1]
      assert call_kwargs["headers"]["Authorization"] == "Bearer test-theirstack-key"
      assert call_kwargs["headers"]["Content-Type"] == "application/json"

  @pytest.mark.asyncio
  async def test_get_job_offers_includes_pagination_params(self, client, sample_offers):
    """Test that pagination parameters are included in request"""
    mock_db = self._create_mock_db(set())

    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.return_value = {"data": sample_offers}

      mock_http_client = AsyncMock()
      mock_http_client.post = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_http_client

      await client.get_job_offers(mock_db, page=2, limit=20)

      call_kwargs = mock_http_client.post.call_args[1]
      params = call_kwargs["json"]
      assert params["page"] == 2
      assert params["limit"] == 10  # capped at 10

  @pytest.mark.asyncio
  async def test_get_job_offers_caps_limit_at_10(self, client, sample_offers):
    """Test that limit is capped at 10"""
    mock_db = self._create_mock_db(set())

    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.return_value = {"data": sample_offers}

      mock_http_client = AsyncMock()
      mock_http_client.post = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_http_client

      await client.get_job_offers(mock_db, limit=50)

      call_kwargs = mock_http_client.post.call_args[1]
      params = call_kwargs["json"]
      assert params["limit"] == 10

  @pytest.mark.asyncio
  async def test_get_job_offers_includes_max_age_days(self, client, sample_offers):
    """Test that posted_at_max_age_days is included"""
    mock_db = self._create_mock_db(set())

    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.return_value = {"data": sample_offers}

      mock_http_client = AsyncMock()
      mock_http_client.post = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_http_client

      await client.get_job_offers(mock_db)

      call_kwargs = mock_http_client.post.call_args[1]
      params = call_kwargs["json"]
      assert params["posted_at_max_age_days"] == 30

  @pytest.mark.asyncio
  async def test_get_job_offers_includes_technology_slugs_when_present(self, client, sample_offers):
    """Test that technology_slugs are included when present in preferences"""
    prefs = {"technology_slugs": ["python", "django"]}
    mock_db = self._create_mock_db(set(), prefs)

    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.return_value = {"data": sample_offers}

      mock_http_client = AsyncMock()
      mock_http_client.post = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_http_client

      await client.get_job_offers(mock_db)

      call_kwargs = mock_http_client.post.call_args[1]
      params = call_kwargs["json"]

      assert "job_technology_slug_or" in params
      # assert "python" in params["job_technology_slug_or"]
      # assert "django" in params["job_technology_slug_or"]
      assert set(params["job_technology_slug_or"]) == {"python", "django"}
      

  @pytest.mark.asyncio
  async def test_get_job_offers_includes_remote_when_not_none(self, client, sample_offers):
    """Test that remote is included when not None"""
    prefs = {"remote": True}
    mock_db = self._create_mock_db(set(), prefs)

    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.return_value = {"data": sample_offers}

      mock_http_client = AsyncMock()
      mock_http_client.post = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_http_client

      await client.get_job_offers(mock_db)

      call_kwargs = mock_http_client.post.call_args[1]
      params = call_kwargs["json"]
      assert "remote" in params
      assert params["remote"] is True

  @pytest.mark.asyncio
  async def test_get_job_offers_excludes_remote_when_none(self, client, sample_offers):
    """Test that remote is excluded when None"""
    prefs = {"remote": None}
    mock_db = self._create_mock_db(set(), prefs)

    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.return_value = {"data": sample_offers}

      mock_http_client = AsyncMock()
      mock_http_client.post = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_http_client

      await client.get_job_offers(mock_db)

      call_kwargs = mock_http_client.post.call_args[1]
      params = call_kwargs["json"]
      assert "remote" not in params

  @pytest.mark.asyncio
  async def test_get_job_offers_includes_seniority_levels(self, client, sample_offers):
    """Test that seniority_levels are included"""
    prefs = {"seniority_levels": ["junior", "mid"]}
    mock_db = self._create_mock_db(set(), prefs)

    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.return_value = {"data": sample_offers}

      mock_http_client = AsyncMock()
      mock_http_client.post = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_http_client

      await client.get_job_offers(mock_db)

      call_kwargs = mock_http_client.post.call_args[1]
      params = call_kwargs["json"]
      assert "job_seniority_or" in params
      # assert "junior" in params["job_seniority_or"]
      # assert "mid" in params["job_seniority_or"]
      assert set(params["job_seniority_or"]) == {"junior", "mid"}

  @pytest.mark.asyncio
  async def test_get_job_offers_includes_countries(self, client, sample_offers):
    """Test that countries are included"""
    prefs = {"countries": ["PL", "DE"]}
    mock_db = self._create_mock_db(set(), prefs)

    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.return_value = {"data": sample_offers}

      mock_http_client = AsyncMock()
      mock_http_client.post = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_http_client

      await client.get_job_offers(mock_db)

      call_kwargs = mock_http_client.post.call_args[1]
      params = call_kwargs["json"]
      assert "job_country_code_or" in params
      assert set(params["job_country_code_or"]) == {"PL", "DE"}

  @pytest.mark.asyncio
  async def test_get_job_offers_raises_on_http_error(self, client):
    """Test that HTTPStatusError is raised on API error"""
    mock_db = self._create_mock_db(set())

    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.status_code = 401
      mock_response.text = "Unauthorized"

      error = httpx.HTTPStatusError(
          message="401 Unauthorized",
          request=MagicMock(),
          response=mock_response
      )

      mock_http_client = AsyncMock()
      mock_http_client.post = AsyncMock(side_effect=error)
      mock_client_class.return_value.__aenter__.return_value = mock_http_client

      with pytest.raises(httpx.HTTPStatusError):
        await client.get_job_offers(mock_db)

  @pytest.mark.asyncio
  async def test_get_job_offers_raises_on_general_exception(self, client):
    """Test that general exceptions are raised"""
    mock_db = self._create_mock_db(set())

    with patch("httpx.AsyncClient") as mock_client_class:
      mock_http_client = AsyncMock()
      mock_http_client.post = AsyncMock(side_effect=ConnectionError("Connection failed"))
      mock_client_class.return_value.__aenter__.return_value = mock_http_client

      with pytest.raises(ConnectionError):
        await client.get_job_offers(mock_db)

  @pytest.mark.asyncio
  async def test_get_job_offers_returns_empty_list_when_no_new_offers(self, client):
    """Test that empty list is returned when all offers already exist"""
    existing_ids = {1, 2, 3}
    mock_db = self._create_mock_db(existing_ids)
    sample_offers = [
        {"id": 1, "title": "Python Developer"},
        {"id": 2, "title": "Node.js Developer"},
        {"id": 3, "title": "Java Developer"}
    ]

    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.return_value = {"data": sample_offers}

      mock_http_client = AsyncMock()
      mock_http_client.post = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_http_client

      result = await client.get_job_offers(mock_db)

      assert result == []

  @pytest.mark.asyncio
  async def test_get_job_offers_uses_default_page_and_limit(self, client, sample_offers):
    """Test that default page and limit values are used"""
    mock_db = self._create_mock_db(set())

    with patch("httpx.AsyncClient") as mock_client_class:
      mock_response = MagicMock()
      mock_response.json.return_value = {"data": sample_offers}

      mock_http_client = AsyncMock()
      mock_http_client.post = AsyncMock(return_value=mock_response)
      mock_client_class.return_value.__aenter__.return_value = mock_http_client

      await client.get_job_offers(mock_db)

      call_kwargs = mock_http_client.post.call_args[1]
      params = call_kwargs["json"]
      assert params["page"] == 1
      assert params["limit"] == 10