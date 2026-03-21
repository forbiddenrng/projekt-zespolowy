import pytest
from app.schemas.cv import CVRequest, CVResponse

class TestCVRequest:
  """Tests for CVRequest"""

  def test_cv_request_valid_data(self, sample_cv_data):
    """CVRequest accepts valid data"""

    cv = CVRequest(**sample_cv_data)

    assert cv.name == "John Doe"
    assert cv.experience == "5 years in Python development"
    assert cv.skills == ["Python", "FastAPI", "PostgreSQL"]

  def test_cv_request_missing_name(self, sample_cv_data):
    """CVRequest requires name"""
    sample_cv_data.pop("name")

    with pytest.raises(ValueError):
      CVRequest(**sample_cv_data)

  def test_cv_request_missing_experience(self, sample_cv_data):
    """CVRequest requires experience"""
    sample_cv_data.pop("experience")

    with pytest.raises(ValueError):
      CVRequest(**sample_cv_data)

  def test_cv_request_missing_skills(self, sample_cv_data):
    """CVRequest requires skills"""
    sample_cv_data.pop("skills")

    with pytest.raises(ValueError):
      CVRequest(**sample_cv_data)

  def test_cv_request_skills_is_list(self, sample_cv_data):
    """CVRequest skills must be a list"""
    sample_cv_data["skills"] = "Python, Java"

    with pytest.raises(ValueError):
      CVRequest(**sample_cv_data)
  
  def test_cv_request_empty_skills(self, sample_cv_data):
    """CVRequest skills can be empty"""
    sample_cv_data["skills"] = []

    cv = CVRequest(**sample_cv_data)
    assert cv.skills == []

  def test_cv_request_serialization(self, sample_cv_data):
    """CVRequest can be serialzied"""
    cv = CVRequest(**sample_cv_data)
    data = cv.model_dump()

    assert data["name"] == "John Doe"
    assert isinstance(data["skills"], list)


class TestCVResponse:
  """Tests for CVResponse"""
  # def __init__(self):
  #   self.cv_text = "Generated CV"

  cv_text = "Generated CV"
    
  def test_cv_response_valid_data(self):
    """CVResponse valid data"""
    response = CVResponse(cv_text=self.cv_text)
    assert response.cv_text == self.cv_text

  def test_cv_response_missing_cv_text(self):
    """CVResponse requires cv_text"""
    with pytest.raises(ValueError):
      CVResponse()

  def test_cv_response_empty_cv_text(self):
    """CVResponse requires cv_text"""
    response = CVResponse(cv_text="")
    assert response.cv_text == ""

  def test_cv_response_serialization(self):
    """CVResponse can be serialized"""
    response = CVResponse(cv_text=self.cv_text)
    json_data = response.model_dump_json()
    assert "cv_text" in json_data
    assert self.cv_text in json_data


  







  

  
  

