import os

# Test user data
TEST_USERS = [
  {
    "id": "test|01",
    "user":  {
      "name": "John",
      "surname": "Kowalski",
      "phoneNumber": "567123891",
      "email": "user1@email.com",
      "city": "Gdańsk",
      "abilities": [
        {"name": "Znajomość Dockera"}
      ],
      "certificates": [
        {"name": "Docker i Kubernetes", "issuer": "Kubernetes", "certificationDate": "2025-10-09"}
      ]
    },
    "preferences": {
      "technology_slugs": ["Python", "FastAPI", "MongoDB"],
      "seniority_levels": ["junior", "mid_level"],
      "remote": True,
      "hybrid": False,
      "countries": ["PL", "US"],
    }
  },

  {
    "id": "test|02",
      "user": {
      "name": "John",
      "surname": "Kowalski",
      "phoneNumber": "567123892",
      "email": "user2@email.com",
      "city": "Gdańsk",
      "abilities": [
        {"name": "Znajomość Dockera"}
      ],
      "certificates": [
        {"name": "Docker i Kubernetes", "issuer": "Kubernetes", "certificationDate": "2025-10-09"}
      ]
    },
    "preferences": {
      "technology_slugs": ["Python", "FastAPI", "MongoDB"],
      "seniority_levels": ["junior", "mid_level"],
      "remote": True,
      "hybrid": False,
      "countries": ["PL", "US"],
    }
  }
]

# Test job offers
TEST_JOB_OFFERS = [
  {
    "external_id": "job-001",
    "title": "Senior Python Developer",
    "company": "Tech Corp",
    "description": "Looking for experienced Python developer",
    "requirements": ["Python", "FastAPI", "PostgreSQL"],
    "salary_min": 100000,
    "salary_max": 150000,
  },
  {
    "external_id": "job-002",
    "title": "Full Stack Engineer",
    "company": "StartUp Inc",
    "description": "Full stack position",
    "requirements": ["TypeScript", "React", "Node.js"],
    "salary_min": 80000,
    "salary_max": 120000,
  },
]


# Service URLs
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8001")
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://localhost:5051")