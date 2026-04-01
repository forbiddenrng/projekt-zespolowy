import pytest
import json
from fastapi import HTTPException
from unittest.mock import patch, MagicMock

from app.api.v1.job_router import get_user_id


class TestGetUserId:
	"""Test suite for get_user_id middleware"""

	# ===== Missing or Empty Header Tests =====

	@pytest.mark.asyncio
	async def test_raises_401_when_x_user_header_is_none(self):
		"""Test that 401 HTTPException is raised when x_user header is None"""
		# Act & Assert
		with pytest.raises(HTTPException) as exc_info:
			await get_user_id(x_user=None)

		assert exc_info.value.status_code == 401
		assert exc_info.value.detail == "No X-User header"

	@pytest.mark.asyncio
	async def test_raises_401_when_x_user_header_is_empty_string(self):
		"""Test that 401 HTTPException is raised when x_user header is empty string"""
		# Act & Assert
		with pytest.raises(HTTPException) as exc_info:
			await get_user_id(x_user="")

		assert exc_info.value.status_code == 401
		assert exc_info.value.detail == "No X-User header"

	@pytest.mark.asyncio
	async def test_raises_401_when_x_user_header_is_whitespace(self):
		"""Test that 401 HTTPException is raised when x_user header is only whitespace"""
		# Act & Assert
		with pytest.raises(HTTPException) as exc_info:
			await get_user_id(x_user="	")

		assert exc_info.value.status_code == 401

	# ===== Simple String Header Tests (Non-JSON) =====

	@pytest.mark.asyncio
	async def test_returns_user_id_when_header_is_simple_string(self):
		"""Test that simple string value is returned as user_id"""
		# Arrange
		user_id_value = "user_123"

		# Act
		result = await get_user_id(x_user=user_id_value)

		# Assert
		assert result == user_id_value

	@pytest.mark.asyncio
	async def test_returns_user_id_with_special_characters(self):
		"""Test that user_id with special characters is returned correctly"""
		# Arrange
		user_id_value = "user@domain.com"

		# Act
		result = await get_user_id(x_user=user_id_value)

		# Assert
		assert result == user_id_value

	@pytest.mark.asyncio
	async def test_returns_user_id_with_hyphens_and_underscores(self):
		"""Test that user_id with hyphens and underscores is returned correctly"""
		# Arrange
		user_id_value = "user-id_123"

		# Act
		result = await get_user_id(x_user=user_id_value)

		# Assert
		assert result == user_id_value

	@pytest.mark.asyncio
	async def test_returns_user_id_with_numbers_only(self):
		"""Test that numeric user_id is returned correctly"""
		# Arrange
		user_id_value = "123456"

		# Act
		result = await get_user_id(x_user=user_id_value)

		# Assert
		assert result == "123456"

	# ===== JSON Header Tests - Valid JSON =====

	@pytest.mark.asyncio
	async def test_returns_id_from_valid_json_header(self):
		"""Test that id is extracted from valid JSON header"""
		# Arrange
		user_id_value = "user_456"
		x_user_json = json.dumps({"id": user_id_value})

		# Act
		result = await get_user_id(x_user=x_user_json)

		# Assert
		assert result == user_id_value

	@pytest.mark.asyncio
	async def test_returns_id_from_json_with_extra_fields(self):
		"""Test that id is extracted from JSON with additional fields"""
		# Arrange
		user_id_value = "user_789"
		x_user_json = json.dumps({
			"id": user_id_value,
			"name": "John Doe",
			"email": "john@example.com"
		})

		# Act
		result = await get_user_id(x_user=x_user_json)

		# Assert
		assert result == user_id_value

	@pytest.mark.asyncio
	async def test_returns_id_from_json_with_whitespace(self):
		"""Test that id is extracted from JSON with leading/trailing whitespace"""
		# Arrange
		user_id_value = "user_whitespace"
		x_user_json = f'	{json.dumps({"id": user_id_value})}	'

		# Act
		result = await get_user_id(x_user=x_user_json)

		# Assert
		assert result == user_id_value

	@pytest.mark.asyncio
	async def test_returns_id_from_json_with_nested_structure(self):
		"""Test that id is extracted from JSON (even with nested objects)"""
		# Arrange
		user_id_value = "user_nested"
		x_user_json = json.dumps({
			"id": user_id_value,
			"profile": {"name": "John"}
		})

		# Act
		result = await get_user_id(x_user=x_user_json)

		# Assert
		assert result == user_id_value

	@pytest.mark.asyncio
	async def test_returns_json_id_with_alphanumeric_value(self):
		"""Test that alphanumeric id from JSON is returned correctly"""
		# Arrange
		user_id_value = "user123abc456"
		x_user_json = json.dumps({"id": user_id_value})

		# Act
		result = await get_user_id(x_user=x_user_json)

		# Assert
		assert result == user_id_value

	# ===== JSON Header Tests - Invalid Cases =====

	@pytest.mark.asyncio
	async def test_returns_fallback_when_json_missing_id_field(self):
		"""Test that fallback value is returned when JSON doesn't have 'id' field"""
		# Arrange
		x_user_json = json.dumps({"name": "John Doe", "email": "john@example.com"})

		# Act
		result = await get_user_id(x_user=x_user_json)

		# Assert
		# Should return the original x_user value as fallback
		assert result == x_user_json

	@pytest.mark.asyncio
	async def test_returns_fallback_when_json_id_is_empty_string(self):
		"""Test that fallback value is returned when JSON id field is empty"""
		# Arrange
		x_user_json = json.dumps({"id": ""})

		# Act
		result = await get_user_id(x_user=x_user_json)

		# Assert
		assert result == x_user_json

	@pytest.mark.asyncio
	async def test_returns_fallback_when_json_id_is_null(self):
		"""Test that fallback value is returned when JSON id field is null"""
		# Arrange
		x_user_json = json.dumps({"id": None})

		# Act
		result = await get_user_id(x_user=x_user_json)

		# Assert
		assert result == x_user_json

	@pytest.mark.asyncio
	async def test_returns_fallback_when_json_is_empty_object(self):
		"""Test that fallback value is returned when JSON is empty object"""
		# Arrange
		x_user_json = json.dumps({})

		# Act
		result = await get_user_id(x_user=x_user_json)

		# Assert
		assert result == x_user_json

	# ===== Invalid JSON Tests =====

	@pytest.mark.asyncio
	async def test_returns_fallback_when_json_is_malformed(self):
		"""Test that fallback value is returned when JSON is malformed"""
		# Arrange
		x_user_malformed = '{"id": "user123"'	# Missing closing brace

		# Act
		result = await get_user_id(x_user=x_user_malformed)

		# Assert
		assert result == x_user_malformed

	@pytest.mark.asyncio
	async def test_returns_fallback_when_json_has_syntax_error(self):
		"""Test that fallback value is returned when JSON has syntax error"""
		# Arrange
		x_user_invalid = '{id: "user123"}'	# Missing quotes around key

		# Act
		result = await get_user_id(x_user=x_user_invalid)

		# Assert
		assert result == x_user_invalid

	@pytest.mark.asyncio
	async def test_returns_fallback_when_header_looks_like_json_but_isnt(self):
		"""Test that fallback value is returned for string that looks like JSON but isn't"""
		# Arrange
		x_user_fake_json = '{not valid json}'

		# Act
		result = await get_user_id(x_user=x_user_fake_json)

		# Assert
		assert result == x_user_fake_json

	# ===== Edge Cases =====

	@pytest.mark.asyncio
	async def test_handling_json_with_boolean_id(self):
		"""Test handling when id field is a boolean"""
		# Arrange
		x_user_json = json.dumps({"id": True})

		# Act
		result = await get_user_id(x_user=x_user_json)

		# Assert
		# Boolean True is truthy, so it should be returned
		assert result is True or result == x_user_json

	@pytest.mark.asyncio
	async def test_handling_json_with_zero_as_id(self):
		"""Test handling when id field is 0 (falsy number)"""
		# Arrange
		x_user_json = json.dumps({"id": 0})

		# Act
		result = await get_user_id(x_user=x_user_json)

		# Assert
		# 0 is falsy, so fallback should be used
		assert result == x_user_json

	@pytest.mark.asyncio
	async def test_handling_json_with_numeric_id(self):
		"""Test handling when id field is a number"""
		# Arrange
		x_user_json = json.dumps({"id": 12345})

		# Act
		result = await get_user_id(x_user=x_user_json)

		# Assert
		# Number is truthy, so it should be returned
		assert result == 12345

	@pytest.mark.asyncio
	async def test_long_user_id_string(self):
		"""Test handling of very long user_id string"""
		# Arrange
		long_user_id = "user_" + "x" * 1000

		# Act
		result = await get_user_id(x_user=long_user_id)

		# Assert
		assert result == long_user_id
		assert len(result) == len(long_user_id)

	@pytest.mark.asyncio
	async def test_unicode_characters_in_user_id(self):
		"""Test handling of unicode characters in user_id"""
		# Arrange
		unicode_user_id = "użytkownik_123"

		# Act
		result = await get_user_id(x_user=unicode_user_id)

		# Assert
		assert result == unicode_user_id

	@pytest.mark.asyncio
	async def test_json_with_unicode_id(self):
		"""Test handling of unicode in JSON id field"""
		# Arrange
		unicode_id = "użytkownik_json_123"
		x_user_json = json.dumps({"id": unicode_id})

		# Act
		result = await get_user_id(x_user=x_user_json)

		# Assert
		assert result == unicode_id

	# ===== JSON vs Plain String Detection Tests =====

	@pytest.mark.asyncio
	async def test_string_starting_with_brace_is_treated_as_json(self):
		"""Test that string starting with { is treated as potential JSON"""
		# Arrange
		x_user = '{"id":"abc123"}'

		# Act
		result = await get_user_id(x_user=x_user)

		# Assert
		assert result == "abc123"

	@pytest.mark.asyncio
	async def test_string_not_starting_with_brace_is_treated_as_plain(self):
		"""Test that string not starting with { is treated as plain string"""
		# Arrange
		x_user = 'plain_user_id'

		# Act
		result = await get_user_id(x_user=x_user)

		# Assert
		assert result == 'plain_user_id'

	@pytest.mark.asyncio
	async def test_string_with_brace_in_middle_is_treated_as_plain(self):
		"""Test that string with { in middle (not start) is treated as plain"""
		# Arrange
		x_user = 'user_{with_brace}'

		# Act
		result = await get_user_id(x_user=x_user)

		# Assert
		assert result == 'user_{with_brace}'

	# ===== Return Type Tests =====

	@pytest.mark.asyncio
	async def test_return_type_is_string_for_simple_input(self):
		"""Test that return type is string for simple input"""
		# Arrange
		x_user = "user_123"

		# Act
		result = await get_user_id(x_user=x_user)

		# Assert
		assert isinstance(result, str)

	@pytest.mark.asyncio
	async def test_return_type_for_json_numeric_id(self):
		"""Test return type when JSON id is numeric"""
		# Arrange
		x_user_json = json.dumps({"id": 12345})

		# Act
		result = await get_user_id(x_user=x_user_json)

		# Assert
		# Numeric id from JSON would be int
		assert isinstance(result, int)

	@pytest.mark.asyncio
	async def test_exception_type_for_missing_header(self):
		"""Test that correct exception type is raised for missing header"""
		# Act & Assert
		with pytest.raises(HTTPException):
			await get_user_id(x_user=None)

	# ===== Integration-like Tests =====

	@pytest.mark.asyncio
	async def test_multiple_calls_with_different_inputs(self):
		"""Test multiple sequential calls with different inputs"""
		# Arrange & Act
		result1 = await get_user_id(x_user="user_1")
		result2 = await get_user_id(x_user=json.dumps({"id": "user_2"}))
		result3 = await get_user_id(x_user="user_3")

		# Assert
		assert result1 == "user_1"
		assert result2 == "user_2"
		assert result3 == "user_3"

	@pytest.mark.asyncio
	async def test_idempotent_calls_same_input(self):
		"""Test that calling with same input multiple times gives same result"""
		# Arrange
		x_user = "test_user_idempotent"

		# Act
		result1 = await get_user_id(x_user=x_user)
		result2 = await get_user_id(x_user=x_user)
		result3 = await get_user_id(x_user=x_user)

		# Assert
		assert result1 == result2 == result3 == x_user