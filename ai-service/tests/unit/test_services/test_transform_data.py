import pytest

from app.services.cv_task import (
  _transform_education,
  _transform_experience,
  _transform_certificates,
  _transform_languages,
  _transform_cv_data,
)



class TestTransformEducation:
  """Test suite for _transform_education function"""
  
  @pytest.fixture
  def mock_education_data(self):
    """Mock education data"""
    return [
       {
        "degree": "Bachelor",
        "major": "CS",
        "school_name": "Uni1",
        "start_date": "2018-09-01",
        "end_date": "2022-06-30",
      },
      {
        "degree": "Master",
        "major": "AI",
        "school_name": "Uni2",
        "start_date": "2023-09-01",
        "end_date": None,
      },
    ]
  

  def test_transform_single_education(self, mock_education_data):
    """Test transforming single education entry"""
    education = mock_education_data[:1]
    result = _transform_education(education)

    assert len(result) == 1
    assert result[0]["degree"] == education[0]["degree"]
    assert result[0]["major"] == education[0]["major"]
    assert result[0]["school_name"] == education[0]["school_name"]
    assert result[0]["start_date"] == "01-09-2018"
    assert result[0]["end_date"] == "30-06-2022"

  def test_transform_education_with_ongoing(self, mock_education_data):
    """Test transforming education with no end date (ongoing)"""
    mock_education_data[0]["end_date"] = None

    result = _transform_education(mock_education_data)

    assert result[0]["end_date"] == "Obecnie"

  def test_transform_multiple_education_entries(self, mock_education_data):
    """Test transforming multiple education entries"""

    result = _transform_education(mock_education_data)

    assert len(result) == 2
    assert result[0]["degree"] == "Bachelor"
    assert result[1]["degree"] == "Master"

  def test_transform_education_with_missing_fields(self, mock_education_data):
    """Test transforming education with missing fields"""
    mock_education_data[0].pop("major")
    mock_education_data[0].pop("start_date")

    result = _transform_education(mock_education_data)

    assert result[0]["degree"] == "Bachelor"
    assert result[0]["major"] == ""
    assert result[0]["start_date"] == ""


class TestTransformExperience:
  """Test suite for _transform_experience function"""

  @pytest.fixture
  def mock_experience_data(self):
    """Mock experience data"""
    return [
      {
        "position": "Junior Dev",
        "company": "StartUp",
        "start_date": "2019-01-01",
        "end_date": "2020-12-31",
        "description": "First job",
      },
      {
        "position": "Senior Dev",
        "company": "Enterprise",
        "start_date": "2021-01-01",
        "end_date": None,
        "description": "Current role",
      },
    ]

  def test_transform_single_experience(self, mock_experience_data):
    """Test transforming single experience entry"""
    experience = mock_experience_data[:1]

    result = _transform_experience(experience)

    assert len(result) == 1
    assert result[0]["position"] == experience[0]["position"]
    assert result[0]["company"] == experience[0]["company"]
    assert result[0]["start_date"] == "01-01-2019"
    assert result[0]["end_date"] == "31-12-2020"
    assert result[0]["description"] == experience[0]["description"]

  def test_transform_experience_with_ongoing(self, mock_experience_data):
    """Test transforming experience with no end date (current job)"""
    experience = mock_experience_data[:1]
    experience[0]["end_date"] = None

    result = _transform_experience(experience)

    assert result[0]["end_date"] == "Obecnie"

  def test_transform_multiple_experiences(self, mock_experience_data):
      """Test transforming multiple experience entries"""

      result = _transform_experience(mock_experience_data)

      assert len(result) == 2
      assert result[0]["position"] == mock_experience_data[0]["position"]
      assert result[1]["position"] == mock_experience_data[1]["position"]


class TestTransformCertificates:
  """Test suite for _transform_certificates function"""

  @pytest.fixture
  def mock_certificates_data(self):
    """Mock data for certificates"""
    return [
      {
        "name": "AWS Certified",
        "certification_date": "2023-06-15",
        "issuer": "Amazon",
      },
      {
        "name": "GCP Professional",
        "certification_date": "2024-01-20",
        "issuer": "Google",
      },
    ]

  def test_transform_single_certificate(self, mock_certificates_data):
    """Test transforming single certificate"""
    certificates = mock_certificates_data[:1]

    result = _transform_certificates(certificates)

    assert len(result) == 1
    assert result[0]["name"] == "AWS Certified"
    assert result[0]["certification_date"] == "15-06-2023"
    assert result[0]["issuer"] == "Amazon"

  def test_transform_multiple_certificates(self, mock_certificates_data):
    """Test transforming multiple certificates"""

    result = _transform_certificates(mock_certificates_data)

    assert len(result) == 2
    assert result[0]["issuer"] == "Amazon"
    assert result[1]["issuer"] == "Google"

  def test_transform_certificates_with_missing_fields(self, mock_certificates_data):
      """Test transforming certificates with missing fields"""
      certificates = mock_certificates_data[:1]
      certificates[0].pop("certification_date")
      certificates[0].pop("issuer")

      result = _transform_certificates(certificates)

      assert result[0]["name"] == "AWS Certified"
      assert result[0]["certification_date"] == ""
      assert result[0]["issuer"] == ""


class TestTransformLanguages:
  """Test suite for _transform_languages function"""

  @pytest.fixture
  def mock_languages_data(self):
    return [
      {"language": {"name": "English"}, "level": "Native"},
      {"language": {"name": "Polish"}, "level": "Fluent"},
      {"language": {"name": "German"}, "level": "Intermediate"},
    ]

  def test_transform_single_language(self, mock_languages_data):
    """Test transforming single language"""
    languages = mock_languages_data[:1]

    result = _transform_languages(languages)

    assert len(result) == 1
    assert result[0]["name"] == "English"
    assert result[0]["level"] == "Native"

  def test_transform_multiple_languages(self, mock_languages_data):
    """Test transforming multiple languages"""

    result = _transform_languages(mock_languages_data)

    assert len(result) == 3
    assert result[0]["name"] == "English"
    assert result[1]["name"] == "Polish"
    assert result[2]["name"] == "German"

  def test_transform_languages_with_missing_language_field(self, mock_languages_data):
    """Test transforming language with missing language object"""
    languages = mock_languages_data[:1]
    languages[0].pop("language")

    result = _transform_languages(languages)

    assert result[0]["name"] == ""
    assert result[0]["level"] == "Native"


class TestTransformCVData:
  """Test suite for _transform_cv_data function"""

  @pytest.fixture
  def mock_generated_cv_data(self):
    return {
      "summary": "Experienced developer",
      "quick_summary": "Dev with 5 years experience",
      "links": ["https://github.com/user"],
    }
  

  @pytest.fixture
  def mock_user_data(self):
    return {
      "abilities": [
        {"name": "Python"},
        {"name": "JavaScript"},
      ],
      "user_languages": [
        {"language": {"name": "English"}, "level": "Native"},
      ],
      "certificates": [
        {
          "name": "AWS Cert",
          "certification_date": "2023-06-15",
          "issuer": "Amazon",
        }
      ],
      "work_experiences": [
        {
          "position": "Dev",
          "company": "Corp",
          "start_date": "2020-01-01",
          "end_date": None,
          "description": "Working",
        }
      ],
      "education": [
        {
          "degree": "Bachelor",
          "major": "CS",
          "school_name": "Uni",
          "start_date": "2015-09-01",
          "end_date": "2019-06-30",
        }
      ],
    }
  



  def test_transform_cv_data_complete(self, mock_generated_cv_data, mock_user_data):
    """Test transforming complete CV data"""

    result = _transform_cv_data(mock_generated_cv_data, mock_user_data)

    assert result["summary"] == "Experienced developer"
    assert result["quick_summary"] == "Dev with 5 years experience"
    assert result["skills"] == ["Python", "JavaScript"]
    assert len(result["languages"]) == 1
    assert len(result["certificates"]) == 1
    assert len(result["experience"]) == 1
    assert len(result["education"]) == 1
    assert result["links"] == ["https://github.com/user"]

  def test_transform_cv_data_with_empty_collections(self, mock_generated_cv_data):
    """Test transforming CV data with empty collections"""
    mock_generated_cv_data["links"] = []

    user_data = {
      "abilities": [],
      "user_languages": [],
      "certificates": [],
      "work_experiences": [],
      "education": [],
    }

    result = _transform_cv_data(mock_generated_cv_data, user_data)

    assert result["skills"] == []
    assert result["languages"] == []
    assert result["certificates"] == []
    assert result["experience"] == []
    assert result["education"] == []
