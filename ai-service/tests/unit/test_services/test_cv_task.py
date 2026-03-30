import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch, call
from bson import ObjectId

from app.services.cv_task import (
    generate_cv_with_retry,
    generate_cv_task,
    APIGenerationError,
    get_time,
)


@pytest.mark.asyncio
class TestGenerateCVWithRetry:
  """Test suite for generate_cv_with_retry function"""

  @pytest.fixture
  def mock_user_data(self):
    return {"name": "John"}
  
  @pytest.fixture
  def mock_job_offer(self):
    return "Senior Developer"
  
  @pytest.fixture
  def mock_expected_result(self):
    return {"summary": "Test", "quick_summary": "Test Quick"}

  async def test_generate_cv_success_on_first_attempt(self, mock_user_data, mock_job_offer, mock_expected_result):
    """Test successful generation on first attempt"""

    with patch("app.services.cv_task.generate_cv_data", new_callable=AsyncMock) as mock_gen:
      mock_gen.return_value = mock_expected_result

      result = await generate_cv_with_retry(mock_user_data, mock_job_offer)

      assert result == mock_expected_result
      mock_gen.assert_called_once_with(mock_user_data, mock_job_offer)

  async def test_generate_cv_retry_on_value_error_then_success(self, mock_user_data, mock_job_offer, mock_expected_result):
    """Test retry mechanism on ValueError then success"""

    with patch("app.services.cv_task.generate_cv_data", new_callable=AsyncMock) as mock_gen:        
      mock_gen.side_effect = [
        ValueError("Invalid JSON"),
        ValueError("Invalid JSON"),
        mock_expected_result,
      ]

      result = await generate_cv_with_retry(mock_user_data, mock_job_offer, max_retries=3)

      assert result == mock_expected_result
      assert mock_gen.call_count == 3

  async def test_generate_cv_raises_api_error_after_max_retries(self, mock_user_data, mock_job_offer):
    """Test APIGenerationError raised after max retries"""

    with patch("app.services.cv_task.generate_cv_data", new_callable=AsyncMock) as mock_gen:
      mock_gen.side_effect = ValueError("Invalid JSON")

      with pytest.raises(APIGenerationError) as exc_info:
        await generate_cv_with_retry(mock_user_data, mock_job_offer, max_retries=3)

      assert "Failed to generate CV after 3 attempts" in str(exc_info.value)
      assert mock_gen.call_count == 3

  async def test_generate_cv_raises_non_retriable_error_immediately(self, mock_user_data, mock_job_offer):
    """Test non-retriable errors are raised immediately"""

    with patch("app.services.cv_task.generate_cv_data", new_callable=AsyncMock) as mock_gen:
      mock_gen.side_effect = RuntimeError("Database connection error")

      with pytest.raises(RuntimeError):
        await generate_cv_with_retry(mock_user_data, mock_job_offer, max_retries=3)

      # Should be called only once for non-retriable errors
      assert mock_gen.call_count == 1

  async def test_generate_cv_retry_timing(self):
      """Test that retry waits 3 seconds between attempts"""
      user_data = {"name": "John"}
      job_offer = "Senior Developer"
      expected_result = {"summary": "Test"}

      with patch("app.services.cv_task.generate_cv_data", new_callable=AsyncMock) as mock_gen:
          with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
              mock_gen.side_effect = [
                  ValueError("Error"),
                  ValueError("Error"),
                  expected_result,
              ]

              result = await generate_cv_with_retry(user_data, job_offer, max_retries=3)

              assert result == expected_result
              # Should sleep between retries (2 times for 3 attempts)
              assert mock_sleep.call_count == 2
              mock_sleep.assert_called_with(3)


@pytest.mark.asyncio
class TestGenerateCVTask:
    """Test suite for generate_cv_task Celery function"""

    @pytest.fixture
    def mock_services(self):
        """Setup mocked services"""
        with patch("app.services.cv_task.mongodb") as mock_mongo, \
             patch("app.services.cv_task.CVGenerationService") as mock_cv_gen_service, \
             patch("app.services.cv_task.CVService") as mock_cv_service, \
             patch("app.services.cv_task.UserServiceClient") as mock_user_client, \
             patch("app.services.cv_task.generate_cv_with_retry", new_callable=AsyncMock) as mock_gen_retry:
            
            mock_mongo.connect_db = AsyncMock()
            mock_mongo.close_db = AsyncMock()

            mock_cv_gen_instance = MagicMock()
            mock_cv_gen_service.return_value = mock_cv_gen_instance
            mock_cv_gen_instance.update_task_status = AsyncMock()
            mock_cv_gen_instance.send_webhook = AsyncMock()

            mock_cv_instance = MagicMock()
            mock_cv_service.return_value = mock_cv_instance
            mock_cv_instance.generate_cv_html = MagicMock(return_value="<html>CV</html>")
            mock_cv_instance.save_pdf = AsyncMock(return_value="2026/01/user123/task123.pdf")

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
                "summary": "Experienced developer",
                "quick_summary": "Dev profile",
                "links": ["https://github.com/user"],
                "skills": ["Python", "JavaScript"],
                "certificates": [],
                "languages": [],
                "education": [],
                "experience": [],
            }

            yield {
                "mongo": mock_mongo,
                "cv_gen_service": mock_cv_gen_instance,
                "cv_service": mock_cv_instance,
                "user_client": mock_user_instance,
                "gen_retry": mock_gen_retry,
            }

    def test_generate_cv_task_successful_flow(self, mock_services):
        """Test successful CV generation task flow"""
        with patch.dict("os.environ", {"API_BASE_URL": "http://localhost:8000"}):
            generate_cv_task(
                task_id="task123",
                user_id="user123",
                job_offer="Senior Python Developer"
            )

            # Verify MongoDB connection
            mock_services["mongo"].connect_db.assert_called_once()

            # Verify status update to PROCESSING
            update_calls = mock_services["cv_gen_service"].update_task_status.call_args_list
            assert update_calls[0][0][1] == "PROCESSING"

            # Verify user data retrieval
            mock_services["user_client"].get_user_data.assert_called_once_with("user123")

            # Verify CV generation
            mock_services["gen_retry"].assert_called_once()

            # Verify HTML generation
            mock_services["cv_service"].generate_cv_html.assert_called_once()

            # Verify PDF saving
            mock_services["cv_service"].save_pdf.assert_called_once()

            # Verify final status update to COMPLETED
            final_call = update_calls[-1]
            assert final_call[0][1] == "COMPLETED"

            # Verify webhook sent
            mock_services["cv_gen_service"].send_webhook.assert_called()

            # Verify MongoDB disconnect
            mock_services["mongo"].close_db.assert_called_once()

    def test_generate_cv_task_fails_on_api_generation_error(self, mock_services):
        """Test task failure when API generation fails"""
        mock_services["gen_retry"].side_effect = APIGenerationError(
            "Failed to generate CV after 3 attempts"
        )

        with pytest.raises(APIGenerationError):
            generate_cv_task(
                task_id="task123",
                user_id="user123",
                job_offer="Senior Python Developer"
            )

        # Verify status updated to FAILED
        update_calls = mock_services["cv_gen_service"].update_task_status.call_args_list
        failed_call = [c for c in update_calls if c[0][1] == "FAILED"]
        assert len(failed_call) > 0
        assert "Failed to generate CV data" in str(failed_call[0])

    def test_generate_cv_task_fails_on_user_data_retrieval_error(self, mock_services):
        """Test task failure when user data retrieval fails"""
        mock_services["user_client"].get_user_data.side_effect = Exception(
            "User service unavailable"
        )

        with pytest.raises(Exception):
            generate_cv_task(
                task_id="task123",
                user_id="user123"
            )

        # Verify status updated to FAILED
        update_calls = mock_services["cv_gen_service"].update_task_status.call_args_list
        failed_call = [c for c in update_calls if c[0][1] == "FAILED"]
        assert len(failed_call) > 0

    def test_generate_cv_task_fails_on_pdf_save_error(self, mock_services):
        """Test task failure when PDF saving fails"""
        mock_services["cv_service"].save_pdf.side_effect = Exception(
            "Storage error"
        )

        with pytest.raises(Exception):
            generate_cv_task(
                task_id="task123",
                user_id="user123"
            )

        # Verify status updated to FAILED
        update_calls = mock_services["cv_gen_service"].update_task_status.call_args_list
        failed_call = [c for c in update_calls if c[0][1] == "FAILED"]
        assert len(failed_call) > 0

    def test_generate_cv_task_cleanup_on_error(self, mock_services):
        """Test that MongoDB connection is closed even on error"""
        mock_services["gen_retry"].side_effect = Exception("Unexpected error")

        with pytest.raises(Exception):
            generate_cv_task(
                task_id="task123",
                user_id="user123"
            )

        # Verify cleanup happened
        mock_services["mongo"].close_db.assert_called()

    def test_generate_cv_task_sends_webhook_on_completion(self, mock_services):
        """Test webhook is sent on successful completion"""
        with patch.dict("os.environ", {"API_BASE_URL": "http://localhost:8000"}):
            generate_cv_task(
                task_id="task123",
                user_id="user123"
            )

            # Check webhook send calls
            webhook_calls = mock_services["cv_gen_service"].send_webhook.call_args_list
            
            # Should be called twice: once on failure path (if any) or on success
            assert len(webhook_calls) > 0
            
            # Last call should be successful completion
            last_call = webhook_calls[-1]
            assert last_call[0][2] == "COMPLETED"

    def test_generate_cv_task_sends_webhook_on_failure(self, mock_services):
        """Test webhook is sent on failure"""
        mock_services["gen_retry"].side_effect = APIGenerationError(
            "Failed to generate CV"
        )

        with pytest.raises(APIGenerationError):
            generate_cv_task(
                task_id="task123",
                user_id="user123"
            )

        # Check webhook send calls
        webhook_calls = mock_services["cv_gen_service"].send_webhook.call_args_list
        assert len(webhook_calls) > 0
        
        # Check if failure webhook was sent
        failure_calls = [c for c in webhook_calls if len(c[0]) >= 3 and c[0][2] == "FAILED"]
        assert len(failure_calls) > 0

    def test_generate_cv_task_without_job_offer(self, mock_services):
        """Test task works without job_offer parameter"""
        with patch.dict("os.environ", {"API_BASE_URL": "http://localhost:8000"}):
            generate_cv_task(
                task_id="task123",
                user_id="user123"
            )

            # Should complete successfully
            mock_services["cv_gen_service"].update_task_status.assert_called()