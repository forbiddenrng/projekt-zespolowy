"""
Integration tests for CV generation task search and status endpoints.
"""

import pytest
import requests
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from tests.integration.config import AI_SERVICE_URL, TEST_USERS, MONGODB_DB, MONGODB_URL
import asyncio
import os


@pytest.fixture(scope="session")
def mongodb_config():
	"""Get MongoDB configuration"""
	
	return {
		"url": MONGODB_URL,
		"db_name": MONGODB_DB,
	}


@pytest.fixture
async def mongodb_client(mongodb_config):
	"""Create async MongoDB client for test setup"""
	client = AsyncIOMotorClient(mongodb_config["url"])
	db = client[mongodb_config["db_name"]]
	yield db
	# Cleanup after tests
	client.close()


@pytest.fixture
async def setup_test_tasks(mongodb_client):
	"""
	Insert sample tasks into MongoDB for testing.
	Creates 3 tasks: 2 for user1, 1 for user2 with different statuses.
	"""
	user1_id = TEST_USERS[0]["id"]
	user2_id = TEST_USERS[1]["id"]
	
	# Clear existing tasks for test users
	await mongodb_client["cv_generation_tasks"].delete_many(
		{"user_id": {"$in": [user1_id, user2_id]}}
	)
	
	# Create sample tasks
	tasks = [
		{
			"user_id": user1_id,
			"job_offer": "Senior Python Developer at TechCorp",
			"status": "PENDING",
			"created_at": datetime.now(timezone.utc),
			"started_at": None,
			"completed_at": None,
			"pdf_path": None,
			"error": None,
		},
		{
			"user_id": user1_id,
			"job_offer": "Full Stack Engineer at StartUp",
			"status": "COMPLETED",
			"created_at": datetime.now(timezone.utc),
			"started_at": datetime.now(timezone.utc),
			"completed_at": datetime.now(timezone.utc),
			"pdf_path": "2026/01/user123/task_completed.pdf",
			"error": None,
		},
		{
			"user_id": user1_id,
			"job_offer": "DevOps Engineer at CloudCo",
			"status": "FAILED",
			"created_at": datetime.now(timezone.utc),
			"started_at": datetime.now(timezone.utc),
			"completed_at": None,
			"pdf_path": None,
			"error": "API rate limit exceeded",
		},
		{
			"user_id": user2_id,
			"job_offer": "Data Scientist at AI Corp",
			"status": "PENDING",
			"created_at": datetime.now(timezone.utc),
			"started_at": None,
			"completed_at": None,
			"pdf_path": None,
			"error": None,
		},
	]
	
	# Insert tasks and store their IDs for verification
	result = await mongodb_client["cv_generation_tasks"].insert_many(tasks)
	
	return {
		"user1_id": user1_id,
		"user2_id": user2_id,
		"user1_task_ids": result.inserted_ids[:3],
		"user2_task_id": result.inserted_ids[3],
	}


@pytest.mark.integration
class TestCVTaskSearch:
	"""Test CV task search endpoint."""
	
	@pytest.fixture
	def user1_id(self):
		return TEST_USERS[0]["id"]
	
	@pytest.fixture
	def headers(self, user1_id):
		return {"X-User": user1_id}
	
	@pytest.mark.asyncio
	async def test_search_cv_tasks_all(self, wait_for_services, setup_test_tasks, headers):
		"""Test retrieving all CV tasks for a user."""
		response = requests.get(
			f"{AI_SERVICE_URL}/ai/cv/search",
			headers=headers,
			timeout=10,
		)
		
		assert response.status_code == 200
		data = response.json()
		
		assert "tasks" in data
		assert "total" in data
		assert "skip" in data
		assert "limit" in data
		assert "count" in data
		
		# User1 should have 3 tasks
		assert data["count"] == 3
		assert data["total"] == 3
		assert len(data["tasks"]) == 3
	
	@pytest.mark.asyncio
	async def test_search_cv_tasks_by_status_pending(self, wait_for_services, setup_test_tasks, headers):
		"""Test searching CV tasks by PENDING status."""
		response = requests.get(
			f"{AI_SERVICE_URL}/ai/cv/search?status=PENDING",
			headers=headers,
			timeout=10,
		)
		
		assert response.status_code == 200
		data = response.json()
		
		assert data["count"] == 1
		assert data["total"] == 1
		assert data["tasks"][0]["status"] == "PENDING"
	
	@pytest.mark.asyncio
	async def test_search_cv_tasks_by_status_completed(self, wait_for_services, setup_test_tasks, headers):
		"""Test searching CV tasks by COMPLETED status."""
		response = requests.get(
			f"{AI_SERVICE_URL}/ai/cv/search?status=COMPLETED",
			headers=headers,
			timeout=10,
		)
		
		assert response.status_code == 200
		data = response.json()
		
		assert data["count"] == 1
		assert data["tasks"][0]["status"] == "COMPLETED"
	
	@pytest.mark.asyncio
	async def test_search_cv_tasks_by_status_failed(self, wait_for_services, setup_test_tasks, headers):
		"""Test searching CV tasks by FAILED status."""
		response = requests.get(
			f"{AI_SERVICE_URL}/ai/cv/search?status=FAILED",
			headers=headers,
			timeout=10,
		)
		
		assert response.status_code == 200
		data = response.json()
		
		assert data["count"] == 1
		assert data["tasks"][0]["status"] == "FAILED"
		assert data["tasks"][0]["error"] == "API rate limit exceeded"
	
	@pytest.mark.asyncio
	async def test_search_cv_tasks_pagination(self, wait_for_services, setup_test_tasks, headers):
		"""Test pagination in task search."""
		# Get first page (limit=1)
		response = requests.get(
			f"{AI_SERVICE_URL}/ai/cv/search?skip=0&limit=1",
			headers=headers,
			timeout=10,
		)
		
		assert response.status_code == 200
		data = response.json()
		
		assert data["count"] == 1
		assert data["total"] == 3
		assert len(data["tasks"]) == 1
		
		# Get second page
		response = requests.get(
			f"{AI_SERVICE_URL}/ai/cv/search?skip=1&limit=1",
			headers=headers,
			timeout=10,
		)
		
		data = response.json()
		assert data["count"] == 1
		assert data["skip"] == 1
	
	@pytest.mark.asyncio
	async def test_search_cv_tasks_invalid_status(self, wait_for_services, setup_test_tasks, headers):
		"""Test searching with invalid status filter."""
		response = requests.get(
			f"{AI_SERVICE_URL}/ai/cv/search?status=INVALID_STATUS",
			headers=headers,
			timeout=10,
		)
		
		
		assert response.status_code == 200
		data = response.json()
		assert len(data["tasks"]) == 0
		assert data["total"] == 0
		assert data["count"] == 0


@pytest.mark.integration
class TestCVTaskStatus:
	"""Test CV task status endpoint."""
	
	@pytest.fixture
	def user1_id(self):
		return TEST_USERS[0]["id"]
	
	@pytest.fixture
	def user2_id(self):
		return TEST_USERS[1]["id"]
	
	@pytest.fixture
	def user1_headers(self, user1_id):
		return {"X-User": user1_id}
	
	@pytest.fixture
	def user2_headers(self, user2_id):
		return {"X-User": user2_id}
	
	@pytest.mark.asyncio
	async def test_get_cv_status_success(self, wait_for_services, setup_test_tasks, user1_headers):
		"""Test retrieving status of a specific CV task."""
		task_id = str(setup_test_tasks["user1_task_ids"][0])
		
		response = requests.get(
			f"{AI_SERVICE_URL}/ai/generate/cv/{task_id}/status",
			headers=user1_headers,
			timeout=10,
		)
		
		assert response.status_code == 200
		data = response.json()
		
		assert "task_id" in data
		assert "status" in data
		assert "created_at" in data
		assert data["task_id"] == task_id
		assert data["status"] == "PENDING"
	
	@pytest.mark.asyncio
	async def test_get_cv_status_completed(self, wait_for_services, setup_test_tasks, user1_headers):
		"""Test retrieving status of a completed task."""
		task_id = str(setup_test_tasks["user1_task_ids"][1])
		
		response = requests.get(
			f"{AI_SERVICE_URL}/ai/generate/cv/{task_id}/status",
			headers=user1_headers,
			timeout=10,
		)
		
		assert response.status_code == 200
		data = response.json()
		
		assert data["status"] == "COMPLETED"
		assert data["completed_at"] is not None
	
	@pytest.mark.asyncio
	async def test_get_cv_status_failed(self, wait_for_services, setup_test_tasks, user1_headers):
		"""Test retrieving status of a failed task."""
		task_id = str(setup_test_tasks["user1_task_ids"][2])
		
		response = requests.get(
			f"{AI_SERVICE_URL}/ai/generate/cv/{task_id}/status",
			headers=user1_headers,
			timeout=10,
		)
		
		assert response.status_code == 200
		data = response.json()
		
		assert data["status"] == "FAILED"
		assert data["error"] == "API rate limit exceeded"
	
	@pytest.mark.asyncio
	async def test_get_cv_status_unauthorized_different_user(
		self, 
		wait_for_services, 
		setup_test_tasks, 
		user1_headers,
		user2_headers
	):
		"""Test that user cannot access task of another user."""
		task_id = str(setup_test_tasks["user1_task_ids"][0])
		
		# User2 tries to access User1's task
		response = requests.get(
			f"{AI_SERVICE_URL}/ai/generate/cv/{task_id}/status",
			headers=user2_headers,
			timeout=10,
		)
		
		assert response.status_code == 401
		data = response.json()
		assert "detail" in data
		assert "Unauthorized" in data["detail"]
	
	@pytest.mark.asyncio
	async def test_get_cv_status_not_found(self, wait_for_services, user1_headers):
		"""Test retrieving status of non-existent task."""
		fake_task_id = "000000000000000000000000"	# Valid MongoDB ObjectId format but non-existent
		
		response = requests.get(
			f"{AI_SERVICE_URL}/ai/generate/cv/{fake_task_id}/status",
			headers=user1_headers,
			timeout=10,
		)
		
		assert response.status_code == 404
		data = response.json()
		assert "detail" in data
		assert "Task not found" in data["detail"]
	
	@pytest.mark.asyncio
	async def test_get_cv_status_invalid_task_id_format(self, wait_for_services, user1_headers):
		"""Test retrieving status with invalid task ID format."""
		invalid_task_id = "invalid-id-format"
		
		response = requests.get(
			f"{AI_SERVICE_URL}/ai/generate/cv/{invalid_task_id}/status",
			headers=user1_headers,
			timeout=10,
		)
		
		# Should return 404 (task not found) since ID is invalid
		assert response.status_code == 404