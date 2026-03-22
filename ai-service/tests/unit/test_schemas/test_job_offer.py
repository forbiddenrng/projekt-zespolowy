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


  