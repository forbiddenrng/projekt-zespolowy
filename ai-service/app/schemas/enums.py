from enum import Enum


class CountryCode(str, Enum):
  """ISO 3166-1 alpha-2 country codes"""
  PL = "PL"  # Poland
  US = "US"  # United States
  UK = "UK"  # United Kingdom
  DE = "DE"  # Germany
  FR = "FR"  # France
  NL = "NL"  # Netherlands
  SE = "SE"  # Sweden
  
  def __str__(self):
    return self.value

# 'c_level', 'staff', 'senior', 'junior' or 'mid_level'
class SeniorityLevel(str, Enum):
  """Job seniority levels"""
  JUNIOR = "junior"
  MID = "mid_level"
  SENIOR = "senior"
  STAFF = "staff"
  C_LEVEL = "c_level"
  
  def __str__(self):
    return self.value
