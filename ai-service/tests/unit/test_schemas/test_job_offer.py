import pytest
from pydantic import ValidationError
from app.schemas.job_offer import (
  Company,
  Salary,
  Location,
  JobOfferCreate,
  JobOffer
)
from bson import ObjectId

class TestCompany:
  """Tests for Company schema"""

  def test_company_valid_data(self):
    """Company accepts valid data"""
    company = Company(
      name="Google",
      country="USA",
      logo_url="https://example.com/logo.png"
    )

    assert company.name == "Google"
    assert company.country == "USA"

  def test_company_missing_name(self):
    """Company requires name"""

    with pytest.raises(ValidationError):
      company = Company(
        country="USA",
        logo_url="https://example.com/logo.png"
      )
  
  def test_company_optional_fields(self):
    """Company country and logo can be None"""

    company = Company(name="Google")

    assert company.name == "Google"
    assert company.country is None
    assert company.logo_url is None

  
  def test_company_serialization(self):
    """Company can be serialzied"""
    company = Company(name="Google")
    data = company.model_dump()

    assert data["name"] == "Google"



class TestSalary:
  """Tests for Salary schema"""

  def test_salary_valid_data(self):
    """Salary accepts valid data"""
    salary = Salary(
      min_annual_salary=100000,
      max_annual_salary=150000,
      salary_currency="USD"
    )

    assert salary.min_annual_salary == 100000
    assert salary.max_annual_salary == 150000
    assert salary.salary_currency == "USD"

  def test_salary_partial_data(self):
    """Salary accepts partial values"""

    salary = Salary(
      min_annual_salary=100000,
    )

    assert salary.min_annual_salary == 100000
    assert salary.max_annual_salary is None
    assert salary.salary_currency is None
  
  def test_salary_all_optional(self):
    """Salary fields are optional"""

    salary = Salary()

    assert salary.min_annual_salary is None
    assert salary.max_annual_salary is None
    assert salary.salary_currency is None

  
  def test_salary_serialization(self):
    """Salary can be serialzied"""
    salary = Salary(
      min_annual_salary=100000,
    )
    data = salary.model_dump()

    assert data["min_annual_salary"] == 100000


class TestLocation:
  """Tests for Location"""
  
  def test_location_valid_data(self):
    """Location accepts valid data"""
    location = Location(
      country_name="United States",
      display_name="San Francisco, CA"
    )
    
    assert location.country_name == "United States"
    assert location.display_name == "San Francisco, CA"
  
  def test_location_all_optional(self):
    """All Location fields are optional"""
    location = Location()
    
    assert location.country_name is None
    assert location.display_name is None

  def test_location_serialization(self):
    """Location can be serialzied"""
    location = Location(
      country_name="United States",
      display_name="San Francisco, CA"
    )

    data = location.model_dump()

    assert data["country_name"] == "United States"
    assert data["display_name"] == "San Francisco, CA"


class TestJobOfferCreate:
  """Tests for JobOfferCreate"""

  def test_job_offer_create_valid(self, sample_job_offer_data):
    """JobOfferCreate accepts valid data"""
    offer = JobOfferCreate(**sample_job_offer_data)

    assert offer.title == "Senior Python Developer"
    assert offer.company.name == "Google"
    assert len(offer.location) == 1
    assert offer.remote is True

  def test_job_offer_create_missing_required_fields(self, sample_job_offer_data):
    """JobOfferCreate required fields"""
    sample_job_offer_data.pop("title")

    with pytest.raises(ValidationError):
      JobOfferCreate(**sample_job_offer_data)


  def test_job_offer_create_invalid_company_structure(self, sample_job_offer_data):
    """JobOfferCreate.Company must have valid structure"""
    sample_job_offer_data["company"] = {"key": "value"}

    with pytest.raises(ValidationError):
      JobOfferCreate(**sample_job_offer_data)

  def test_job_offer_create_empty_salary(self, sample_job_offer_data):
    """JobOfferCreate.Salary can be empty"""
    sample_job_offer_data["salary"] = {}

    offer = JobOfferCreate(**sample_job_offer_data)

    assert offer.salary.min_annual_salary is None
    assert offer.salary.max_annual_salary is None

  def test_job_offer_create_empty_location(self, sample_job_offer_data):
    """JobOfferCreate.Location can be empty"""
    sample_job_offer_data["location"] = []

    offer = JobOfferCreate(**sample_job_offer_data)
    assert offer.location == []

  def test_job_offer_create_many_locations(self, sample_job_offer_data):
    """JobOfferCreate.Location can have multiple locations"""
    sample_job_offer_data["location"] = [
      {
        "country_name": "United States",
        "display_name": "San Francisco, CA"
      },
      {
        "country_name": "United States",
        "display_name": "San Antonio, TX"
      }
    ]

    offer = JobOfferCreate(**sample_job_offer_data)
    assert len(offer.location) == 2

  def test_job_offer_create_serialization(self, sample_job_offer_data):
    """JobOfferCreate.Location can have multiple locations"""

    offer = JobOfferCreate(**sample_job_offer_data)
    data = offer.model_dump()

    assert data["title"] == "Senior Python Developer"
    assert data["company"]["name"] == "Google"
  

  



  
  



  