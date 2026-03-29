import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from bson import ObjectId
from app.services.cover_letter_generation_service import CoverLetterGenerationService


@pytest.mark.asyncio
class TestCoverLetterGenerationService:
    """Tests for CoverLetterGenerationService"""

    @pytest.fixture
    def service(self, mock_mongodb_with_config_letter):
        """Create service instance with mocked MongoDB"""
        return CoverLetterGenerationService()

    @pytest.fixture
    def mock_collection(self, mock_mongodb_with_config_letter):
        """Get mocked collection"""
        return mock_mongodb_with_config_letter.db.__getitem__.return_value

    # ============= create_task tests =============
    async def test_create_task_valid_data(self, service, mock_collection, sample_task_data):
        """create_task inserts task and returns ID"""
        task_id = ObjectId()
        mock_collection.insert_one = AsyncMock(
            return_value=MagicMock(inserted_id=task_id)
        )

        result = await service.create_task(
            user_id="user123",
            job_offer="Senior Python Developer"
        )

        assert result == str(task_id)
        mock_collection.insert_one.assert_called_once()

    async def test_create_task_default_values(self, service, mock_collection):
        """create_task uses empty string as default for job_offer"""
        task_id = ObjectId()
        mock_collection.insert_one = AsyncMock(
            return_value=MagicMock(inserted_id=task_id)
        )

        result = await service.create_task(user_id="user123")

        assert result == str(task_id)
        ## get insert one call arguments
        call_args = mock_collection.insert_one.call_args[0][0]
        assert call_args["job_offer"] == ""

    async def test_create_task_structure(self, service, mock_collection):
        """create_task creates task with correct structure"""
        task_id = ObjectId()
        mock_collection.insert_one = AsyncMock(
            return_value=MagicMock(inserted_id=task_id)
        )

        await service.create_task(user_id="user123", job_offer="Python dev")

        call_args = mock_collection.insert_one.call_args[0][0]
        
        assert call_args["user_id"] == "user123"
        assert call_args["job_offer"] == "Python dev"
        assert call_args["status"] == "PENDING"
        assert call_args["created_at"] is not None
        assert call_args["started_at"] is None
        assert call_args["completed_at"] is None
        assert call_args["pdf_path"] is None
        assert call_args["error"] is None

    # ============= get_task tests =============
    async def test_get_task_found(self, service, mock_collection, sample_task_data):
        """get_task returns task when found"""
        task_id = sample_task_data["_id"]
        mock_collection.find_one = AsyncMock(return_value=sample_task_data)

        result = await service.get_task(str(task_id))

        assert result is not None
        assert result["user_id"] == "user123"
        assert result["status"] == "COMPLETED"
        mock_collection.find_one.assert_called_once()

    async def test_get_task_not_found(self, service, mock_collection):
        """get_task returns None when task not found"""
        task_id = ObjectId()
        mock_collection.find_one = AsyncMock(return_value=None)

        result = await service.get_task(task_id)

        assert result is None

    async def test_get_task_converts_id_to_string(self, service, mock_collection, sample_task_data):
        """get_task converts _id to string"""
        mock_collection.find_one = AsyncMock(return_value=sample_task_data)

        result = await service.get_task(str(sample_task_data["_id"]))

        assert isinstance(result["_id"], str)
        assert result["_id"] == str(sample_task_data["_id"])

    async def test_get_task_invalid_object_id(self, service, mock_collection):
        """get_task handles invalid ObjectId"""
        mock_collection.find_one = AsyncMock(return_value=None)

        result = await service.get_task("invalid_id")

        assert result is None

    # ============= update_task_status tests =============
    async def test_update_task_status_pending_to_processing(self, service, mock_collection):
        """update_task_status updates status"""
        task_id = ObjectId()
        mock_collection.update_one = AsyncMock()

        await service.update_task_status(
            task_id=str(task_id),
            status="PROCESSING",
            started_at=datetime.now(timezone.utc)
        )

        mock_collection.update_one.assert_called_once()
        call_args, call_kwargs = mock_collection.update_one.call_args

        # Verify query
        update_dict = call_args[1]
        assert call_args[0]["_id"] == task_id
        assert update_dict["$set"]["status"] == "PROCESSING"

    async def test_update_task_status_with_extra_fields(self, service, mock_collection):
        """update_task_status updates with additional fields"""
        task_id = ObjectId()
        mock_collection.update_one = AsyncMock()

        await service.update_task_status(
            task_id=str(task_id),
            status="COMPLETED",
            completed_at=datetime.now(timezone.utc),
            pdf_path="path/to/pdf.pdf"
        )

        mock_collection.update_one.assert_called_once()
        call_args, call_kwargs = mock_collection.update_one.call_args
        
        # Check that update contains new fields
        update_dict = call_args[1]
        assert update_dict["$set"]["status"] == "COMPLETED"
        assert update_dict["$set"]["pdf_path"] == "path/to/pdf.pdf"

    # ============= check_generation_limit tests =============
    async def test_check_generation_limit_allowed(self, service, mock_collection):
        """check_generation_limit returns allowed=True when under limit"""
        mock_collection.count_documents = AsyncMock(return_value=3)

        result = await service.check_generation_limit(
            user_id="user123",
            limit=5,
            time_window_minutes=10
        )

        assert result["allowed"] is True
        assert result["current_count"] == 3
        assert result["limit"] == 5

    async def test_check_generation_limit_exceeded(self, service, mock_collection):
        """check_generation_limit returns allowed=False when limit reached"""
        now = datetime.now(timezone(timedelta(hours=1)))
        oldest_task = {
            "created_at": now - timedelta(minutes=5)
        }
        
        mock_collection.count_documents = AsyncMock(return_value=5)
        mock_collection.find_one = AsyncMock(return_value=oldest_task)

        result = await service.check_generation_limit(
            user_id="user123",
            limit=5,
            time_window_minutes=10
        )

        assert result["allowed"] is False
        assert result["current_count"] == 5
        assert "reset_time" in result

    async def test_check_generation_limit_no_reset_time_when_allowed(self, service, mock_collection):
        """check_generation_limit doesn't include reset_time when allowed"""
        mock_collection.count_documents = AsyncMock(return_value=2)

        result = await service.check_generation_limit(
            user_id="user123",
            limit=5
        )

        assert "reset_time" not in result

    # ============= search_tasks tests =============
    async def test_search_tasks_all_tasks(self, service, mock_collection):
        """search_tasks returns all user tasks"""
        tasks = [
            {"_id": ObjectId(), "user_id": "user123", "status": "COMPLETED"},
            {"_id": ObjectId(), "user_id": "user123", "status": "PENDING"},
        ]
        
        async def async_iter(items):
            for item in items:
                yield item
        
        mock_cursor = MagicMock()
        mock_cursor.__aiter__ = MagicMock(return_value=async_iter(tasks))
        mock_cursor.sort = MagicMock(return_value=mock_cursor)
        mock_cursor.skip = MagicMock(return_value=mock_cursor)
        mock_cursor.limit = MagicMock(return_value=mock_cursor)
        
        mock_collection.find = MagicMock(return_value=mock_cursor)
        mock_collection.count_documents = AsyncMock(return_value=2)

        result = await service.search_tasks(
            user_id="user123",
            skip=0,
            limit=10
        )

        assert result["total"] == 2
        assert result["count"] == 2
        assert len(result["tasks"]) == 2
        assert result["skip"] == 0
        assert result["limit"] == 10
    
    async def test_search_tasks_only_user_tasks(self, service, mock_collection):
        """search_tasks returns only user tasks"""
        all_tasks = [
            {"_id": ObjectId(), "user_id": "user123", "status": "COMPLETED"},
            {"_id": ObjectId(), "user_id": "user123", "status": "PENDING"},
            {"_id": ObjectId(), "user_id": "user456", "status": "PENDING"},
            {"_id": ObjectId(), "user_id": "user789", "status": "PENDING"},
        ]

        user_tasks = [t for t in all_tasks if t["user_id"] == "user123"]
        
        async def async_iter(items):
            for item in items:
                yield item
        
        mock_cursor = MagicMock()
        mock_cursor.__aiter__ = MagicMock(return_value=async_iter(user_tasks))
        mock_cursor.sort = MagicMock(return_value=mock_cursor)
        mock_cursor.skip = MagicMock(return_value=mock_cursor)
        mock_cursor.limit = MagicMock(return_value=mock_cursor)
        
        mock_collection.find = MagicMock(return_value=mock_cursor)
        mock_collection.count_documents = AsyncMock(return_value=2)

        result = await service.search_tasks(
            user_id="user123",
            skip=0,
            limit=10
        )

        assert result["total"] == 2
        assert result["count"] == 2
        assert len(result["tasks"]) == 2

        ## check if all tasks are user123's tasks
        for task in result["tasks"]:
            assert task["user_id"] == "user123"

        mock_collection.find.assert_called_once()
        call_args = mock_collection.find.call_args[0][0]
        assert call_args["user_id"] == "user123"

        mock_collection.count_documents.assert_called_once()
        count_query = mock_collection.count_documents.call_args[0][0]
        assert count_query == {"user_id": "user123"}

    async def test_search_tasks_with_status_filter(self, service, mock_collection):
        """search_tasks filters by status"""
        tasks = [
            {"_id": ObjectId(), "user_id": "user123", "status": "COMPLETED"},
        ]
        
        async def async_iter(items):
            for item in items:
                yield item
        
        mock_cursor = MagicMock()
        mock_cursor.__aiter__ = MagicMock(return_value=async_iter(tasks))
        mock_cursor.sort = MagicMock(return_value=mock_cursor)
        mock_cursor.skip = MagicMock(return_value=mock_cursor)
        mock_cursor.limit = MagicMock(return_value=mock_cursor)
        
        mock_collection.find = MagicMock(return_value=mock_cursor)
        mock_collection.count_documents = AsyncMock(return_value=1)

        result = await service.search_tasks(
            user_id="user123",
            status="COMPLETED"
        )

        query = mock_collection.find.call_args[0][0]

        assert result["total"] == 1
        assert result["count"] == 1
        assert query == {"user_id": "user123", "status": "COMPLETED"}

    async def test_search_tasks_pagination(self, service, mock_collection):
        """search_tasks handles pagination"""
        async def async_iter(items):
            for item in items:
                yield item
        
        mock_cursor = MagicMock()
        mock_cursor.__aiter__ = MagicMock(return_value=async_iter([]))
        mock_cursor.sort = MagicMock(return_value=mock_cursor)
        mock_cursor.skip = MagicMock(return_value=mock_cursor)
        mock_cursor.limit = MagicMock(return_value=mock_cursor)
        
        mock_collection.find = MagicMock(return_value=mock_cursor)
        mock_collection.count_documents = AsyncMock(return_value=50)

        result = await service.search_tasks(
            user_id="user123",
            skip=20,
            limit=10
        )

        assert result["total"] == 50
        assert result["skip"] == 20
        assert result["limit"] == 10
        mock_cursor.skip.assert_called_with(20)
        mock_cursor.limit.assert_called_with(10)

    async def test_search_tasks_converts_ids(self, service, mock_collection):
        """search_tasks converts _id to string"""
        task_id = ObjectId()
        tasks = [
            {"_id": task_id, "user_id": "user123", "status": "COMPLETED"},
        ]
        
        async def async_iter(items):
            for item in items:
                yield item
        
        mock_cursor = MagicMock()
        mock_cursor.__aiter__ = MagicMock(return_value=async_iter(tasks))
        mock_cursor.sort = MagicMock(return_value=mock_cursor)
        mock_cursor.skip = MagicMock(return_value=mock_cursor)
        mock_cursor.limit = MagicMock(return_value=mock_cursor)
        
        mock_collection.find = MagicMock(return_value=mock_cursor)
        mock_collection.count_documents = AsyncMock(return_value=1)

        result = await service.search_tasks(user_id="user123")

        assert isinstance(result["tasks"][0]["_id"], str)
        assert result["tasks"][0]["_id"] == str(task_id)

    # ============= send_webhook tests =============
    @pytest.mark.asyncio
    async def test_send_webhook_success(self, service):
        """send_webhook sends successful webhook"""
        with patch('app.services.cover_letter_generation_service.ClientSession') as mock_session_class:
            mock_response = AsyncMock()
            mock_response.status = 200
            
            # Mock async context manager
            mock_session = AsyncMock()
            mock_session.__aenter__ = AsyncMock(return_value=mock_session)
            mock_session.__aexit__ = AsyncMock(return_value=None)
            mock_session.post = AsyncMock(return_value=mock_response.__aenter__())
            
            mock_session_class.return_value = mock_session

            with patch('app.services.cover_letter_generation_service.settings') as mock_settings:
                mock_settings.USER_SERVICE_WEBHOOK_URL = "http://localhost:8001/webhook"
                
                await service.send_webhook(
                    user_id="user123",
                    task_id="task123",
                    status="COMPLETED",
                    pdf_url="http://localhost:8000/pdf/file.pdf"
                )

                mock_session.post.assert_called_once()
                call_args = mock_session.post.call_args
                assert call_args[0][0] == "http://localhost:8001/webhook"
                assert call_args[1]["json"]["user_id"] == "user123"
                assert call_args[1]["json"]["task_id"] == "task123"
                assert call_args[1]["json"]["status"] == "COMPLETED"


    @pytest.mark.asyncio
    async def test_send_webhook_no_url_configured(self, service):
        """send_webhook returns early if no webhook URL"""
        with patch('app.services.cover_letter_generation_service.settings') as mock_settings:
            mock_settings.USER_SERVICE_WEBHOOK_URL = None
            
            # Should not raise exception
            await service.send_webhook(
                user_id="user123",
                task_id="task123",
                status="COMPLETED"
            )

    @pytest.mark.asyncio
    async def test_send_webhook_handles_error(self, service):
        """send_webhook handles connection errors gracefully"""
        with patch('app.services.cover_letter_generation_service.ClientSession') as mock_session_class:
            mock_session = AsyncMock()
            mock_session.__aenter__ = AsyncMock(return_value=mock_session)
            mock_session.__aexit__ = AsyncMock(return_value=None)
            mock_session.post = AsyncMock(side_effect=Exception("Connection failed"))
            
            mock_session_class.return_value = mock_session

            with patch('app.services.cover_letter_generation_service.settings') as mock_settings:
                mock_settings.USER_SERVICE_WEBHOOK_URL = "http://localhost:8001/webhook"
                
                # Should not raise exception
                await service.send_webhook(
                    user_id="user123",
                    task_id="task123",
                    status="COMPLETED"
                )