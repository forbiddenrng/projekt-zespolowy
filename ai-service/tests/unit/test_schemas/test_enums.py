import pytest
from app.schemas.enums import CountryCode, SeniorityLevel, TaskStatus


class TestCountryCode:
  """Tests for CountryCode enum"""
    
  def test_country_code_valid_values(self):
    """CountryCode contains correct valuess"""
    assert CountryCode.PL.value == "PL"
    assert CountryCode.US.value == "US"
    assert CountryCode.UK.value == "UK"
    assert CountryCode.DE.value == "DE"
    assert CountryCode.FR.value == "FR"
    assert CountryCode.NL.value == "NL"
    assert CountryCode.SE.value == "SE"

  def test_country_code_string_conversion(self):
    """CountryCode converts to string"""
    assert str(CountryCode.PL) == "PL"
    assert str(CountryCode.US) == "US"

  def test_country_code_comparison(self):
    """CountryCode is comparable"""
    assert CountryCode.PL == CountryCode.PL
    assert CountryCode.PL != CountryCode.US

  def test_country_code_from_string(self):
    """CountryCode can be created from"""
    code = CountryCode("PL")
    assert code == CountryCode.PL

  def test_invalid_country_code(self):
    """Incoreect country code raises ValueError"""
    with pytest.raises(ValueError):
      CountryCode("XX")


class TestSeniorityLevel:
  """Tests for SeniorityLevel enum"""
  
  def test_seniority_level_valid_values(self):
    """SeniorityLevel contains valid values"""
    assert SeniorityLevel.JUNIOR.value == "junior"
    assert SeniorityLevel.MID.value == "mid_level"
    assert SeniorityLevel.SENIOR.value == "senior"
    assert SeniorityLevel.STAFF.value == "staff"
    assert SeniorityLevel.C_LEVEL.value == "c_level"
  
  def test_seniority_level_string_conversion(self):
    """SeniorityLevel converts to string"""
    assert str(SeniorityLevel.JUNIOR) == "junior"
    assert str(SeniorityLevel.SENIOR) == "senior"
  
  def test_seniority_level_from_string(self):
    """SeniorityLevel can be created from stringa"""
    level = SeniorityLevel("senior")
    assert level == SeniorityLevel.SENIOR
  
  def test_invalid_seniority_level(self):
    """Invalid seniority level raises ValueError"""
    with pytest.raises(ValueError):
      SeniorityLevel("invalid")


class TestTaskStatus:
  """Tests for TaskStatus enum"""
  
  def test_task_status_valid_values(self):
    """TaskStatus contains valid values"""
    assert TaskStatus.PENDING.value == "PENDING"
    assert TaskStatus.PROCESSING.value == "PROCESSING"
    assert TaskStatus.FAILED.value == "FAILED"
    assert TaskStatus.COMPLETED.value == "COMPLETED"
  
  def test_task_status_comparison(self):
    """TaskStatus is comparable"""
    assert TaskStatus.PENDING == TaskStatus.PENDING
    assert TaskStatus.PENDING != TaskStatus.COMPLETED
  
  def test_task_status_from_string(self):
    """TaskStatus can be created from string"""
    status = TaskStatus("COMPLETED")
    assert status == TaskStatus.COMPLETED