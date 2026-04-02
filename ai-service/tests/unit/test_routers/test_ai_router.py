import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from fastapi import HTTPException

from app.api.v1.ai_router import (
	_convert_datetime_to_warsaw,
	verify_cv_task_ownership,
	verify_letter_task_ownership,
	check_cv_generation_rate_limit,
	check_letter_generation_rate_limit,
)
from app.services.cv_generation_service import CVGenerationService
from app.services.cover_letter_generation_service import CoverLetterGenerationService


class TestConvertDatetimeToWarsaw:
	"""Test suite for _convert_datetime_to_warsaw middleware"""

	def test_returns_none_when_input_is_none(self):
		"""Test that None input returns None"""
		result = _convert_datetime_to_warsaw(None)
		assert result is None

	def test_returns_false_when_input_is_false(self):
		"""Test that False input returns False (falsy value)"""
		result = _convert_datetime_to_warsaw(False)
		assert result is False

	def test_converts_datetime_without_timezone(self):
		"""Test that datetime without timezone is treated as UTC and converted to Warsaw time"""
		# Arrange
		naive_dt = datetime(2026, 4, 1, 12, 0, 0)	# April 1, 2026, 12:00 UTC (naive)
		
		# Act
		result = _convert_datetime_to_warsaw(naive_dt)
		
		# Assert
		assert result is not None
		assert result.tzinfo is not None
		# Warsaw is UTC+2 in April (CEST)
		warsaw_tz = ZoneInfo('Europe/Warsaw')
		expected = naive_dt.replace(tzinfo=timezone.utc).astimezone(warsaw_tz)
		assert result == expected

	def test_converts_datetime_with_utc_timezone(self):
		"""Test that UTC datetime is converted to Warsaw time"""
		# Arrange
		utc_dt = datetime(2026, 4, 1, 12, 0, 0, tzinfo=timezone.utc)
		
		# Act
		result = _convert_datetime_to_warsaw(utc_dt)
		
		# Assert
		warsaw_tz = ZoneInfo('Europe/Warsaw')
		expected = utc_dt.astimezone(warsaw_tz)
		assert result == expected
		assert result.hour == 14	# UTC+2 in April

	def test_converts_datetime_with_different_timezone(self):
		"""Test that datetime with different timezone is converted to Warsaw time"""
		# Arrange
		from datetime import timedelta
		pst = timezone(timedelta(hours=-8))
		pst_dt = datetime(2026, 4, 1, 12, 0, 0, tzinfo=pst)
		
		# Act
		result = _convert_datetime_to_warsaw(pst_dt)
		
		# Assert
		warsaw_tz = ZoneInfo('Europe/Warsaw')
		expected = pst_dt.astimezone(warsaw_tz)
		assert result == expected

	def test_warsaw_timezone_is_applied_correctly(self):
		"""Test that result always has Warsaw timezone"""
		utc_dt = datetime(2026, 4, 1, 10, 30, 45, tzinfo=timezone.utc)
		result = _convert_datetime_to_warsaw(utc_dt)
		
		assert result.tzinfo is not None
		assert str(result.tzinfo) == 'Europe/Warsaw'


class TestVerifyCVTaskOwnership:
	"""Test suite for verify_cv_task_ownership middleware"""

	@pytest.fixture
	def mock_cv_service(self):
		"""Create mock CVGenerationService"""
		return AsyncMock(spec=CVGenerationService)

	@pytest.fixture
	def valid_task(self):
		"""Return a valid task dict"""
		return {
			"_id": "507f1f77bcf86cd799439011",
			"user_id": "user_123",
			"status": "COMPLETED",
			"created_at": datetime.now(timezone.utc),
			"job_offer": "Senior Python Developer"
		}

	@pytest.mark.asyncio
	async def test_returns_task_when_user_owns_it(self, mock_cv_service, valid_task):
		"""Test that task is returned when user owns it"""
		# Arrange
		task_id = "507f1f77bcf86cd799439011"
		user_id = "user_123"
		mock_cv_service.get_task.return_value = valid_task

		# Act
		with patch('app.api.v1.ai_router.get_cv_generation_service', return_value=mock_cv_service):
			with patch('app.api.v1.ai_router.get_user_id', return_value=user_id):
				result = await verify_cv_task_ownership(task_id, user_id, mock_cv_service)

		# Assert
		assert result == valid_task
		mock_cv_service.get_task.assert_called_once_with(task_id)

	@pytest.mark.asyncio
	async def test_raises_404_when_task_not_found(self, mock_cv_service):
		"""Test that 404 HTTPException is raised when task doesn't exist"""
		# Arrange
		task_id = "507f1f77bcf86cd799439011"
		user_id = "user_123"
		mock_cv_service.get_task.return_value = None

		# Act & Assert
		with pytest.raises(HTTPException) as exc_info:
			await verify_cv_task_ownership(task_id, user_id, mock_cv_service)

		assert exc_info.value.status_code == 404
		assert "Task not found" in exc_info.value.detail

	@pytest.mark.asyncio
	async def test_raises_401_when_user_does_not_own_task(self, mock_cv_service, valid_task):
		"""Test that 401 HTTPException is raised when user doesn't own the task"""
		# Arrange
		task_id = "507f1f77bcf86cd799439011"
		user_id = "different_user_id"
		mock_cv_service.get_task.return_value = valid_task

		# Act & Assert
		with pytest.raises(HTTPException) as exc_info:
			await verify_cv_task_ownership(task_id, user_id, mock_cv_service)

		assert exc_info.value.status_code == 401
		assert "Unauthorized" in exc_info.value.detail

	@pytest.mark.asyncio
	async def test_task_not_found_detail_message(self, mock_cv_service):
		"""Test correct error message for task not found"""
		# Arrange
		task_id = "invalid_id"
		user_id = "user_123"
		mock_cv_service.get_task.return_value = None

		# Act & Assert
		with pytest.raises(HTTPException) as exc_info:
			await verify_cv_task_ownership(task_id, user_id, mock_cv_service)

		assert exc_info.value.detail == "Task not found"

	@pytest.mark.asyncio
	async def test_unauthorized_detail_message(self, mock_cv_service, valid_task):
		"""Test correct error message for unauthorized access"""
		# Arrange
		task_id = "507f1f77bcf86cd799439011"
		user_id = "wrong_user"
		mock_cv_service.get_task.return_value = valid_task

		# Act & Assert
		with pytest.raises(HTTPException) as exc_info:
			await verify_cv_task_ownership(task_id, user_id, mock_cv_service)

		assert "Unauthorized" in exc_info.value.detail
		assert "you don't have access" in exc_info.value.detail


class TestVerifyLetterTaskOwnership:
	"""Test suite for verify_letter_task_ownership middleware"""

	@pytest.fixture
	def mock_letter_service(self):
		"""Create mock CoverLetterGenerationService"""
		return AsyncMock(spec=CoverLetterGenerationService)

	@pytest.fixture
	def valid_letter_task(self):
		"""Return a valid cover letter task dict"""
		return {
			"_id": "507f1f77bcf86cd799439012",
			"user_id": "user_456",
			"status": "COMPLETED",
			"created_at": datetime.now(timezone.utc),
			"job_offer": "Data Scientist Position",
			"company_info": "Tech Company Inc"
		}

	@pytest.mark.asyncio
	async def test_returns_task_when_user_owns_it(self, mock_letter_service, valid_letter_task):
		"""Test that letter task is returned when user owns it"""
		# Arrange
		task_id = "507f1f77bcf86cd799439012"
		user_id = "user_456"
		mock_letter_service.get_task.return_value = valid_letter_task

		# Act
		result = await verify_letter_task_ownership(task_id, user_id, mock_letter_service)

		# Assert
		assert result == valid_letter_task
		mock_letter_service.get_task.assert_called_once_with(task_id)

	@pytest.mark.asyncio
	async def test_raises_404_when_letter_task_not_found(self, mock_letter_service):
		"""Test that 404 HTTPException is raised when letter task doesn't exist"""
		# Arrange
		task_id = "507f1f77bcf86cd799439012"
		user_id = "user_456"
		mock_letter_service.get_task.return_value = None

		# Act & Assert
		with pytest.raises(HTTPException) as exc_info:
			await verify_letter_task_ownership(task_id, user_id, mock_letter_service)

		assert exc_info.value.status_code == 404
		assert "Task not found" in exc_info.value.detail

	@pytest.mark.asyncio
	async def test_raises_401_when_user_does_not_own_letter_task(self, mock_letter_service, valid_letter_task):
		"""Test that 401 HTTPException is raised when user doesn't own the letter task"""
		# Arrange
		task_id = "507f1f77bcf86cd799439012"
		user_id = "another_user"
		mock_letter_service.get_task.return_value = valid_letter_task

		# Act & Assert
		with pytest.raises(HTTPException) as exc_info:
			await verify_letter_task_ownership(task_id, user_id, mock_letter_service)

		assert exc_info.value.status_code == 401
		assert "Unauthorized" in exc_info.value.detail


class TestCheckCVGenerationRateLimit:
	"""Test suite for check_cv_generation_rate_limit middleware"""

	@pytest.fixture
	def mock_cv_service(self):
		"""Create mock CVGenerationService"""
		return AsyncMock(spec=CVGenerationService)

	@pytest.mark.asyncio
	async def test_returns_limit_check_when_under_limit(self, mock_cv_service):
		"""Test that limit check dict is returned when under rate limit"""
		# Arrange
		user_id = "user_123"
		limit_check = {
			"allowed": True,
			"current_count": 2,
			"limit": 5
		}
		mock_cv_service.check_generation_limit.return_value = limit_check

		# Act
		result = await check_cv_generation_rate_limit(user_id, mock_cv_service)

		# Assert
		assert result == limit_check
		assert result["allowed"] is True
		mock_cv_service.check_generation_limit.assert_called_once_with(
			user_id=user_id,
			limit=5,
			time_window_minutes=10
		)

	@pytest.mark.asyncio
	async def test_raises_429_when_rate_limit_exceeded(self, mock_cv_service):
		"""Test that 429 HTTPException is raised when rate limit is exceeded"""
		# Arrange
		user_id = "user_123"
		reset_time = datetime.now(timezone.utc) + timedelta(minutes=5)
		limit_check = {
			"allowed": False,
			"current_count": 5,
			"limit": 5,
			"reset_time": reset_time
		}
		mock_cv_service.check_generation_limit.return_value = limit_check

		# Act & Assert
		with pytest.raises(HTTPException) as exc_info:
			await check_cv_generation_rate_limit(user_id, mock_cv_service)

		assert exc_info.value.status_code == 429
		detail = exc_info.value.detail
		assert detail["error"] == "Rate limit exceeded"
		assert detail["current_count"] == 5
		assert detail["limit"] == 5
		assert detail["reset_time"] is not None

	@pytest.mark.asyncio
	async def test_rate_limit_error_message_format(self, mock_cv_service):
		"""Test that rate limit error message is properly formatted"""
		# Arrange
		user_id = "user_123"
		reset_time = datetime.now(timezone.utc) + timedelta(minutes=3)
		limit_check = {
			"allowed": False,
			"current_count": 5,
			"limit": 5,
			"reset_time": reset_time
		}
		mock_cv_service.check_generation_limit.return_value = limit_check

		# Act & Assert
		with pytest.raises(HTTPException) as exc_info:
			await check_cv_generation_rate_limit(user_id, mock_cv_service)

		detail = exc_info.value.detail
		assert "You have reached the limit of 5 documents per 10 minutes" in detail["message"]

	@pytest.mark.asyncio
	async def test_rate_limit_with_no_reset_time(self, mock_cv_service):
		"""Test rate limit check when reset_time is None"""
		# Arrange
		user_id = "user_123"
		limit_check = {
			"allowed": False,
			"current_count": 5,
			"limit": 5,
			"reset_time": None
		}
		mock_cv_service.check_generation_limit.return_value = limit_check

		# Act & Assert
		with pytest.raises(HTTPException) as exc_info:
			await check_cv_generation_rate_limit(user_id, mock_cv_service)

		detail = exc_info.value.detail
		assert detail["reset_time"] is None

	@pytest.mark.asyncio
	async def test_limit_check_parameters(self, mock_cv_service):
		"""Test that correct parameters are passed to check_generation_limit"""
		# Arrange
		user_id = "user_456"
		limit_check = {"allowed": True, "current_count": 1, "limit": 5}
		mock_cv_service.check_generation_limit.return_value = limit_check

		# Act
		await check_cv_generation_rate_limit(user_id, mock_cv_service)

		# Assert
		mock_cv_service.check_generation_limit.assert_called_once()
		call_kwargs = mock_cv_service.check_generation_limit.call_args[1]
		assert call_kwargs["user_id"] == user_id
		assert call_kwargs["limit"] == 5
		assert call_kwargs["time_window_minutes"] == 10


class TestCheckLetterGenerationRateLimit:
	"""Test suite for check_letter_generation_rate_limit middleware"""

	@pytest.fixture
	def mock_letter_service(self):
		"""Create mock CoverLetterGenerationService"""
		return AsyncMock(spec=CoverLetterGenerationService)

	@pytest.mark.asyncio
	async def test_returns_limit_check_when_under_limit(self, mock_letter_service):
		"""Test that limit check dict is returned when under rate limit"""
		# Arrange
		user_id = "user_456"
		limit_check = {
			"allowed": True,
			"current_count": 3,
			"limit": 5
		}
		mock_letter_service.check_generation_limit.return_value = limit_check

		# Act
		result = await check_letter_generation_rate_limit(user_id, mock_letter_service)

		# Assert
		assert result == limit_check
		assert result["allowed"] is True
		mock_letter_service.check_generation_limit.assert_called_once_with(
			user_id=user_id,
			limit=5,
			time_window_minutes=10
		)

	@pytest.mark.asyncio
	async def test_raises_429_when_letter_rate_limit_exceeded(self, mock_letter_service):
		"""Test that 429 HTTPException is raised when letter rate limit is exceeded"""
		# Arrange
		user_id = "user_456"
		reset_time = datetime.now(timezone.utc) + timedelta(minutes=7)
		limit_check = {
			"allowed": False,
			"current_count": 5,
			"limit": 5,
			"reset_time": reset_time
		}
		mock_letter_service.check_generation_limit.return_value = limit_check

		# Act & Assert
		with pytest.raises(HTTPException) as exc_info:
			await check_letter_generation_rate_limit(user_id, mock_letter_service)

		assert exc_info.value.status_code == 429
		detail = exc_info.value.detail
		assert detail["error"] == "Rate limit exceeded"
		assert detail["current_count"] == 5
		assert detail["limit"] == 5

	@pytest.mark.asyncio
	async def test_letter_rate_limit_error_details(self, mock_letter_service):
		"""Test letter rate limit error response structure"""
		# Arrange
		user_id = "user_789"
		reset_time = datetime.now(timezone.utc) + timedelta(minutes=2)
		limit_check = {
			"allowed": False,
			"current_count": 5,
			"limit": 5,
			"reset_time": reset_time
		}
		mock_letter_service.check_generation_limit.return_value = limit_check

		# Act & Assert
		with pytest.raises(HTTPException) as exc_info:
			await check_letter_generation_rate_limit(user_id, mock_letter_service)

		detail = exc_info.value.detail
		assert "error" in detail
		assert "message" in detail
		assert "current_count" in detail
		assert "limit" in detail
		assert "reset_time" in detail

	@pytest.mark.asyncio
	async def test_letter_limit_check_with_max_limit(self, mock_letter_service):
		"""Test letter limit check at exactly the limit threshold"""
		# Arrange
		user_id = "user_limit_test"
		limit_check = {"allowed": False, "current_count": 5, "limit": 5}
		mock_letter_service.check_generation_limit.return_value = limit_check

		# Act & Assert
		with pytest.raises(HTTPException) as exc_info:
			await check_letter_generation_rate_limit(user_id, mock_letter_service)

		assert exc_info.value.status_code == 429

	@pytest.mark.asyncio
	async def test_letter_limit_check_just_under_limit(self, mock_letter_service):
		"""Test letter limit check just below the limit threshold"""
		# Arrange
		user_id = "user_under_limit"
		limit_check = {"allowed": True, "current_count": 4, "limit": 5}
		mock_letter_service.check_generation_limit.return_value = limit_check

		# Act
		result = await check_letter_generation_rate_limit(user_id, mock_letter_service)

		# Assert
		assert result["allowed"] is True
		assert result["current_count"] == 4