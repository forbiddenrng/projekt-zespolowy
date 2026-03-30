from datetime import datetime

from app.services.cv_task import _format_date

class TestFormatDate:
  """Test suite for _format_date function"""
  def test_format_date_with_datetime_object(self):
    """Test formatting datetime object"""
    dt = datetime(2025, 12, 15)
    result = _format_date(dt)
    assert result == "15-12-2025"

  def test_format_date_with_iso_string(self):
    """Test formatting ISO format string"""
    result = _format_date("2025-12-15T10:30:00.000Z")
    assert result == "15-12-2025"

  def test_format_date_with_iso_string_no_milliseconds(self):
    """Test formatting ISO string without milliseconds"""
    result = _format_date("2025-12-15T10:30:00")
    assert result == "15-12-2025"

  def test_format_date_with_empty_string(self):
    """Test formatting empty string"""
    result = _format_date("")
    assert result == ""

  def test_format_date_with_none(self):
    """Test formatting None"""
    result = _format_date(None)
    assert result == ""

  def test_format_date_with_whitespace_string(self):
    """Test formatting whitespace-only string"""
    result = _format_date("   ")
    assert result == ""

  def test_format_date_with_invalid_format(self):
    """Test formatting invalid string format"""
    result = _format_date("invalid-date")
    assert result == ""