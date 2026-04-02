#!/usr/bin/env python3
"""
Script to seed test data for integration tests.
Handles both AI service and user service data creation.
"""

import requests
import sys
import time
from typing import Optional
import json

# Configuration
AI_SERVICE_URL = "http://localhost:8001"
USER_SERVICE_URL = "http://localhost:5051"
MAX_RETRIES = 30
RETRY_DELAY = 2


# Test users
TEST_USERS = [
    {
    "id": "124",
    "name": "John",
    "surname": "Kowalski",
    "phoneNumber": "567123891",
    "email": "user1@email.com",
    "city": "Gdańsk",
    "abilities": [
        {"name": "Znajomość Dockera"}
    ],
    "certificates": [
        {"name": "Docker i Kubernetes", "issuer": "Kubernetes", "certificationDate": "2025-10-09T00:00:00"}
    ]
    },
    {
    "id": "125",
    "name": "John",
    "surname": "Kowalski",
    "phoneNumber": "567123892",
    "email": "user2@email.com",
    "city": "Gdańsk",
    "abilities": [
        {"name": "Znajomość Dockera"}
    ],
    "certificates": [
        {"name": "Docker i Kubernetes", "issuer": "Kubernetes", "certificationDate": "2025-10-09T00:00:00"}
    ]
    },

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


def wait_for_service(url: str, max_retries: int = MAX_RETRIES) -> bool:
    """Wait for service to be available."""
    for i in range(max_retries):
        try:
            response = requests.get(f"{url}/health", timeout=5)
            if response.status_code == 200:
                print(f"✓ {url} is available")
                return True
        except requests.RequestException:
            pass

        print(f"  Waiting for {url}... ({i + 1}/{max_retries})")
        time.sleep(RETRY_DELAY)

    print(f"✗ {url} is not available after {max_retries} retries")
    return False


def create_user(user: dict) -> bool:
    """Create a test user in user-service."""
    try:
        user_id = user["id"]
        print(user_id)
        del user["id"]
        print(user)
        response = requests.post(
            f"{USER_SERVICE_URL}/users",
            json=user,
            headers={"x-user": json.dumps({"id": user_id})},
            timeout=10,
        )

        if response.status_code in [200, 201]:
            print(f"✓ User created: {user_id}")
            return True
        else:
            print(f"✗ Failed to create user {user_id}: {response.status_code}")
            print(f"  Response: {response.text}")
            return False

    except Exception as e:
        print(f"✗ Error creating user {user['id']}: {str(e)}")
        return False


def create_job_offers() -> bool:
    """Create test job offers in ai-service."""
    all_success = True

    for offer in TEST_JOB_OFFERS:
        try:
            response = requests.post(
                f"{AI_SERVICE_URL}/api/jobs",
                json=offer,
                headers={"X-User": "admin"},
                timeout=10,
            )

            if response.status_code in [200, 201]:
                print(f"✓ Job offer created: {offer['external_id']}")
            else:
                print(
                    f"✗ Failed to create job offer {offer['external_id']}: {response.status_code}"
                )
                print(f"  Response: {response.text}")
                all_success = False

        except Exception as e:
            print(f"✗ Error creating job offer {offer['external_id']}: {str(e)}")
            all_success = False

    return all_success


def create_user_preferences() -> bool:
    """Create test user preferences in ai-service."""
    all_success = True

    for user in TEST_USERS:
        user_id = user["id"]
        preferences = {
            "technology_slugs": ["Python", "FastAPI", "MongoDB"],
            "seniority_levels": ["JUNIOR", "MID"],
            "remote": True,
            "hybrid": False,
            "country_codes": ["PL", "US"],
        }

        try:
            response = requests.post(
                f"{AI_SERVICE_URL}/api/preferences",
                json=preferences,
                headers={"X-User": user_id},
                timeout=10,
            )

            if response.status_code in [200, 201]:
                print(f"✓ Preferences created for user: {user_id}")
            else:
                print(
                    f"✗ Failed to create preferences for {user_id}: {response.status_code}"
                )
                print(f"  Response: {response.text}")
                all_success = False

        except Exception as e:
            print(f"✗ Error creating preferences for {user_id}: {str(e)}")
            all_success = False

    return all_success


def main():
    """Main seeding function."""
    print("=" * 60)
    print("Starting Integration Test Data Seeding")
    print("=" * 60)

    # Wait for services
    print("\n1. Waiting for services to be available...")
    if not wait_for_service(USER_SERVICE_URL):
        print("✗ User service is not available")
        sys.exit(1)

    if not wait_for_service(AI_SERVICE_URL):
        print("✗ AI service is not available")
        sys.exit(1)

    # Seed user service
    print("\n2. Seeding user service data...")
    user_success = True
    for user in TEST_USERS:
        if not create_user(user):
            user_success = False
    
    if not user_success:
        print("⚠ Some users failed to create")

    # Seed AI service
    print("\n3. Seeding AI service data...")
    
    # print("\n  3a. Creating job offers...")
    # if not create_job_offers():
    #     print("⚠ Some job offers failed to create")

    print("\n  3b. Creating user preferences...")
    if not create_user_preferences():
        print("⚠ Some preferences failed to create")

    print("\n" + "=" * 60)
    print("Data seeding completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()