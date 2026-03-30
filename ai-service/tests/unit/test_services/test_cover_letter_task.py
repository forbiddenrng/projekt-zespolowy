import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.cover_letter_task import (
  generate_cover_letter_with_retry,
  generate_cover_letter_task,
  APIGenerationError,
)


@pytest.mark.asyncio
class TestGenerateCoverLetterWithRetry:
  """Test suite for generate_cover_letter_with_retry function"""

  @pytest.fixture
  def mock_user_data(self):
    return {"name": "John"}
  
  @pytest.fixture
  def mock_job_offer(self):
    return "Senior Developer"
  
  @pytest.fixture
  def mock_company_info(self):
    return "Company info"
  
  @pytest.fixture
  def mock_expected_result(self):
    return {"introduction": "Hi", "closing": "Bye"}

  async def test_generate_cover_letter_success_on_first_attempt(self, mock_user_data, mock_job_offer, mock_company_info, mock_expected_result):
    """Test successful generation on first attempt"""

    with patch("app.services.cover_letter_task.generate_cover_letter_data", new_callable=AsyncMock) as mock_gen:
      mock_gen.return_value = mock_expected_result

      result = await generate_cover_letter_with_retry(mock_user_data, mock_job_offer, mock_company_info)

      assert result == mock_expected_result
      mock_gen.assert_called_once_with(mock_user_data, mock_job_offer, mock_company_info)

  async def test_generate_cover_letter_retry_on_value_error_then_success(self, mock_user_data, mock_job_offer, mock_company_info, mock_expected_result):
    """Test retry mechanism on ValueError then success"""

    with patch("app.services.cover_letter_task.generate_cover_letter_data", new_callable=AsyncMock) as mock_gen:        
      mock_gen.side_effect = [
        ValueError("Invalid JSON"),
        ValueError("Invalid JSON"),
        mock_expected_result,
      ]

      result = await generate_cover_letter_with_retry(mock_user_data, mock_job_offer, mock_company_info, max_retries=3)

      assert result == mock_expected_result
      assert mock_gen.call_count == 3

  async def test_generate_cover_letter_raises_api_error_after_max_retries(self, mock_user_data, mock_job_offer, mock_company_info):
    """Test APIGenerationError raised after max retries"""

    with patch("app.services.cover_letter_task.generate_cover_letter_data", new_callable=AsyncMock) as mock_gen:
      mock_gen.side_effect = ValueError("Invalid JSON")

      with pytest.raises(APIGenerationError) as exc_info:
        await generate_cover_letter_with_retry(mock_user_data, mock_job_offer, mock_company_info, max_retries=3)

      assert "Failed to generate covering letter after 3 attempts" in str(exc_info.value)
      assert mock_gen.call_count == 3

  async def test_generate_cover_letters_raises_non_retriable_error_immediately(self, mock_user_data, mock_job_offer, mock_company_info):
    """Test non-retriable errors are raised immediately"""

    with patch("app.services.cover_letter_task.generate_cover_letter_data", new_callable=AsyncMock) as mock_gen:
      mock_gen.side_effect = RuntimeError("Database connection error")

      with pytest.raises(RuntimeError):
        await generate_cover_letter_with_retry(mock_user_data, mock_job_offer, mock_company_info, max_retries=3)

      # Should be called only once for non-retriable errors
      assert mock_gen.call_count == 1

  async def test_generate_cover_letter_retry_timing(self, mock_user_data, mock_job_offer, mock_company_info, mock_expected_result):
    """Test that retry waits 3 seconds between attempts"""

    with patch("app.services.cover_letter_task.generate_cover_letter_data", new_callable=AsyncMock) as mock_gen:
      with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
        mock_gen.side_effect = [
          ValueError("Error"),
          ValueError("Error"),
          mock_expected_result,
        ]

        result = await generate_cover_letter_with_retry(mock_user_data, mock_job_offer, mock_company_info, max_retries=3)

        assert result == mock_expected_result
        # Should sleep between retries (2 times for 3 attempts)
        assert mock_sleep.call_count == 2
        mock_sleep.assert_called_with(3)


class TestGenerateCoverLetterTask:
  """Test suite for generate_cover_letter_task Celery function"""

  @pytest.fixture
  def mock_services(self):
    """Setup mocked services"""
    with patch("app.services.cover_letter_task.mongodb") as mock_mongo, \
          patch("app.services.cover_letter_task.CoverLetterGenerationService") as mock_cover_letter_gen_service, \
          patch("app.services.cover_letter_task.CoverLetterService") as mock_cover_letter_service, \
          patch("app.services.cover_letter_task.UserServiceClient") as mock_user_client, \
          patch("app.services.cover_letter_task.generate_cover_letter_with_retry", new_callable=AsyncMock) as mock_gen_retry:
        
      mock_mongo.connect_db = AsyncMock()
      mock_mongo.close_db = AsyncMock()

      mock_cover_letter_gen_instance = MagicMock()
      mock_cover_letter_gen_service.return_value = mock_cover_letter_gen_instance
      mock_cover_letter_gen_instance.update_task_status = AsyncMock()
      mock_cover_letter_gen_instance.send_webhook = AsyncMock()

      mock_cover_letter_instance = MagicMock()
      mock_cover_letter_service.return_value = mock_cover_letter_instance
      mock_cover_letter_instance.generate_cover_letter_html = MagicMock(return_value="<html>cover_letter</html>")
      mock_cover_letter_instance.save_pdf = AsyncMock(return_value="2026/01/user123/task123.pdf")

      mock_user_instance = MagicMock()
      mock_user_client.return_value = mock_user_instance
      mock_user_instance.get_user_data = AsyncMock(return_value={
        "name": "John",
        "surname": "Doe",
        "email": "john@example.com",
        "phone_number": "+48123456789",
        "city": "Warsaw",
        "abilities": [{"name": "Python"}, {"name": "JavaScript"}],
        "user_languages": [{"language": {"name": "English"}, "level": "Native"}],
        "certificates": [
          {
            "name": "AWS Cert",
            "certification_date": "2023-06-15",
            "issuer": "Amazon",
          }
        ],
        "work_experiences": [
          {
            "position": "Developer",
            "company": "Tech Corp",
            "start_date": "2020-01-01",
            "end_date": None,
            "description": "Working",
          }
        ],
        "education": [
          {
            "degree": "Bachelor",
            "major": "CS",
            "school_name": "University",
            "start_date": "2015-09-01",
            "end_date": "2019-06-30",
          }
        ],
      })

      mock_gen_retry.return_value = {
        "salutation": "Hi",
        "introduction": "My name is x",
        "body": "I want to work and earn money",
        "closing": "Bye",
        "signature": "x",
      }

      yield {
        "mongo": mock_mongo,
        "cover_letter_gen_service": mock_cover_letter_gen_instance,
        "cover_letter_service": mock_cover_letter_instance,
        "user_client": mock_user_instance,
        "gen_retry": mock_gen_retry,
      }

  def test_generate_cover_letter_task_successful_flow(self, mock_services):
    """Test successful cover_letter generation task flow"""
    with patch.dict("os.environ", {"API_BASE_URL": "http://localhost:8000"}):
      generate_cover_letter_task(
        task_id="task123",
        user_id="user123",
        job_offer="Senior Python Developer",
        company_info="Company info"
      )

      # Verify MongoDB connection
      mock_services["mongo"].connect_db.assert_called_once()

      # Verify status update to PROCESSING
      update_calls = mock_services["cover_letter_gen_service"].update_task_status.call_args_list
      assert update_calls[0][0][1] == "PROCESSING"

      # Verify user data retrieval
      mock_services["user_client"].get_user_data.assert_called_once_with("user123")

      # Verify cover_letter generation
      mock_services["gen_retry"].assert_called_once()

      # Verify HTML generation
      mock_services["cover_letter_service"].generate_cover_letter_html.assert_called_once()

      # Verify PDF saving
      mock_services["cover_letter_service"].save_pdf.assert_called_once()

      # Verify final status update to COMPLETED
      final_call = update_calls[-1]
      assert final_call[0][1] == "COMPLETED"

      # Verify webhook sent
      mock_services["cover_letter_gen_service"].send_webhook.assert_called()

      # Verify MongoDB disconnect
      mock_services["mongo"].close_db.assert_called_once()

  def test_generate_cover_letter_task_fails_on_api_generation_error(self, mock_services):
    """Test task failure when API generation fails"""
    mock_services["gen_retry"].side_effect = APIGenerationError(
      "Failed to generate cover_letter after 3 attempts"
    )

    with pytest.raises(APIGenerationError):
      generate_cover_letter_task(
          task_id="task123",
          user_id="user123",
          job_offer="Senior Python Developer",
          company_info="Company info"
      )

    # Verify status updated to FAILED
    update_calls = mock_services["cover_letter_gen_service"].update_task_status.call_args_list
    failed_call = [c for c in update_calls if c[0][1] == "FAILED"]
    assert len(failed_call) > 0

  def test_generate_cover_letter_task_fails_on_user_data_retrieval_error(self, mock_services):
    """Test task failure when user data retrieval fails"""
    mock_services["user_client"].get_user_data.side_effect = Exception(
        "User service unavailable"
    )

    with pytest.raises(Exception):
      generate_cover_letter_task(
          task_id="task123",
          user_id="user123"
      )

    # Verify status updated to FAILED
    update_calls = mock_services["cover_letter_gen_service"].update_task_status.call_args_list
    failed_call = [c for c in update_calls if c[0][1] == "FAILED"]
    assert len(failed_call) > 0

  def test_generate_cover_letter_task_fails_on_pdf_save_error(self, mock_services):
    """Test task failure when PDF saving fails"""
    mock_services["cover_letter_service"].save_pdf.side_effect = Exception(
      "Storage error"
    )

    with pytest.raises(Exception):
      generate_cover_letter_task(
          task_id="task123",
          user_id="user123"
      )

    # Verify status updated to FAILED
    update_calls = mock_services["cover_letter_gen_service"].update_task_status.call_args_list
    failed_call = [c for c in update_calls if c[0][1] == "FAILED"]
    assert len(failed_call) > 0

  def test_generate_cover_letter_task_cleanup_on_error(self, mock_services):
    """Test that MongoDB connection is closed even on error"""
    mock_services["gen_retry"].side_effect = Exception("Unexpected error")

    with pytest.raises(Exception):
      generate_cover_letter_task(
          task_id="task123",
          user_id="user123"
      )

    # Verify cleanup happened
    mock_services["mongo"].close_db.assert_called()

  def test_generate_cover_letter_task_sends_webhook_on_completion(self, mock_services):
    """Test webhook is sent on successful completion"""
    with patch.dict("os.environ", {"API_BASE_URL": "http://localhost:8000"}):
      generate_cover_letter_task(
          task_id="task123",
          user_id="user123"
      )

      # Check webhook send calls
      webhook_calls = mock_services["cover_letter_gen_service"].send_webhook.call_args_list
      
      # Should be called at least once: once on failure path (if any) or on success
      assert len(webhook_calls) > 0
      
      # Last call should be successful completion
      last_call = webhook_calls[-1]
      assert last_call[0][2] == "COMPLETED"

  def test_generate_cover_letter_task_sends_webhook_on_failure(self, mock_services):
    """Test webhook is sent on failure"""
    mock_services["gen_retry"].side_effect = APIGenerationError(
        "Failed to generate cover_letter"
    )

    with pytest.raises(APIGenerationError):
      generate_cover_letter_task(
          task_id="task123",
          user_id="user123"
      )

    # Check webhook send calls
    webhook_calls = mock_services["cover_letter_gen_service"].send_webhook.call_args_list
    assert len(webhook_calls) > 0
    
    # Check if failure webhook was sent
    failure_calls = [c for c in webhook_calls if len(c[0]) >= 3 and c[0][2] == "FAILED"]
    assert len(failure_calls) > 0

  def test_generate_cover_letter_task_without_job_offer(self, mock_services):
    """Test task works without job_offer parameter"""
    with patch.dict("os.environ", {"API_BASE_URL": "http://localhost:8000"}):
      generate_cover_letter_task(
          task_id="task123",
          user_id="user123"
      )

      # Should complete successfully
      mock_services["cover_letter_gen_service"].update_task_status.assert_called()