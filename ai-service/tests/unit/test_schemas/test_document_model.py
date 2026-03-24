import pytest
from datetime import datetime, timezone
from pydantic import ValidationError
from app.schemas.document_model import (
  GenerateCVRequest, 
  GenerateLetterRequest,
  GenerateDocumentResponse,
  DocumentStatusResponse,
  TaskItem,
  TaskSearchResponse,
  ErrorResponse
) 


class TestGenerateCVRequest:
  """Tests for GenerateCVRequest"""

  def test_generate_cv_request_valid_data(self):
    """GenerateCVRequest accepts valid data"""
    request = GenerateCVRequest(job_offer="Python software engineer")
    assert request.job_offer == "Python software engineer"

  def test_generate_cv_request_default_value(self):
    """GenerateCVRequest uses empty string as default"""
    request = GenerateCVRequest()
    assert request.job_offer == ""

  def test_generate_cv_request_none_value(self):
    """GenerateCVRequest accepts None"""
    request = GenerateCVRequest(job_offer=None)
    assert request.job_offer is None

  def test_generate_cv_request_serialization(self):
    """GenerateCVRequest can be serialized"""
    request = GenerateCVRequest(job_offer="Senior Python Developer")
    data = request.model_dump()
    
    assert data["job_offer"] == "Senior Python Developer"

  def test_generate_cv_request_json_serialization(self):
    """GenerateCVRequest can be serialized to JSON"""
    request = GenerateCVRequest(job_offer="React Developer")
    json_str = request.model_dump_json()
    
    assert "React Developer" in json_str


class TestGenerateLetterRequest:
  """Tests for GenerateLetterRequest"""

  def test_generate_letter_request_valid_data(self):
    """GenerateLetterRequest accepts valid data"""
    request = GenerateLetterRequest(
        job_offer="Senior Python developer",
        company_info="Google - AI company"
    )
    
    assert request.job_offer == "Senior Python developer"
    assert request.company_info == "Google - AI company"

  def test_generate_letter_request_only_job_offer(self):
    """GenerateLetterRequest can have only job_offer"""
    request = GenerateLetterRequest(job_offer="Python developer")
    
    assert request.job_offer == "Python developer"
    assert request.company_info == ""

  def test_generate_letter_request_only_company_info(self):
    """GenerateLetterRequest can have only company_info"""
    request = GenerateLetterRequest(company_info="Microsoft")
    
    assert request.job_offer == ""
    assert request.company_info == "Microsoft"

  def test_generate_letter_request_empty(self):
    """GenerateLetterRequest can be empty"""
    request = GenerateLetterRequest()
    
    assert request.job_offer == ""
    assert request.company_info == ""

  def test_generate_letter_request_none_values(self):
    """GenerateLetterRequest accepts None values"""
    request = GenerateLetterRequest(job_offer=None, company_info=None)
    
    assert request.job_offer is None
    assert request.company_info is None

  def test_generate_letter_request_serialization(self):
    """GenerateLetterRequest can be serialized"""
    request = GenerateLetterRequest(
        job_offer="Python Dev",
        company_info="Tech Startup"
    )
    data = request.model_dump()
    
    assert data["job_offer"] == "Python Dev"
    assert data["company_info"] == "Tech Startup"

  def test_generate_letter_request_json_serialization(self):
    """GenerateLetterRequest can be serialized to JSON"""
    request = GenerateLetterRequest(
        job_offer="Senior Role",
        company_info="Big Tech"
    )
    json_str = request.model_dump_json()
    
    assert "Senior Role" in json_str
    assert "Big Tech" in json_str



class TestGenerateDocumentResponse:
  """Tests for GenerateDocumentResponse"""

  def test_generate_document_response_valid_data(self):
    """GenerateDocumentResponse accepts valid data"""
    response = GenerateDocumentResponse(
        message="CV generation started",
        task_id="507f1f77bcf86cd799439011",
        status="PENDING"
    )
    
    assert response.message == "CV generation started"
    assert response.task_id == "507f1f77bcf86cd799439011"
    assert response.status == "PENDING"

  def test_generate_document_response_missing_message(self):
    """GenerateDocumentResponse requires message"""
    with pytest.raises(ValidationError):
        GenerateDocumentResponse(
            task_id="507f1f77bcf86cd799439011",
            status="PENDING"
        )

  def test_generate_document_response_missing_task_id(self):
    """GenerateDocumentResponse requires task_id"""
    with pytest.raises(ValidationError):
        GenerateDocumentResponse(
            message="CV generation started",
            status="PENDING"
        )

  def test_generate_document_response_missing_status(self):
    """GenerateDocumentResponse requires status"""
    with pytest.raises(ValidationError):
        GenerateDocumentResponse(
            message="CV generation started",
            task_id="507f1f77bcf86cd799439011"
        )

  def test_generate_document_response_serialization(self):
    """GenerateDocumentResponse can be serialized"""
    response = GenerateDocumentResponse(
        message="Document generated",
        task_id="task123",
        status="COMPLETED"
    )
    data = response.model_dump()
    
    assert data["message"] == "Document generated"
    assert data["task_id"] == "task123"
    assert data["status"] == "COMPLETED"

  def test_generate_document_response_json_serialization(self):
    """GenerateDocumentResponse can be serialized to JSON"""
    response = GenerateDocumentResponse(
        message="Processing",
        task_id="task456",
        status="IN_PROGRESS"
    )
    json_str = response.model_dump_json()
    
    assert "Processing" in json_str
    assert "task456" in json_str
    assert "IN_PROGRESS" in json_str

class TestDocumentStatusResponse:
  """Tests for DocumentStatusResponse"""

  def test_document_status_response_valid_completed(self):
    """DocumentStatusResponse accepts completed status"""
    now = datetime.now(timezone.utc)
    response = DocumentStatusResponse(
        task_id="507f1f77bcf86cd799439011",
        status="COMPLETED",
        error=None,
        created_at=now,
        completed_at=now
    )
    
    assert response.task_id == "507f1f77bcf86cd799439011"
    assert response.status == "COMPLETED"
    assert response.error is None
    assert response.created_at == now
    assert response.completed_at == now

  def test_document_status_response_required_fields(self):
    """DocumentStatusResponse requires task_id and status"""
    with pytest.raises(ValidationError):
      DocumentStatusResponse(task_id="task123")

  def test_document_status_response_optional_error(self):
    """DocumentStatusResponse error field is optional"""
    response = DocumentStatusResponse(
        task_id="task123",
        status="PENDING"
    )
    
    assert response.error is None
    assert response.created_at is None
    assert response.completed_at is None

  def test_document_status_response_with_error(self):
    """DocumentStatusResponse can contain error message"""
    response = DocumentStatusResponse(
        task_id="task123",
        status="FAILED",
        error="OpenAI API timeout"
    )
    
    assert response.status == "FAILED"
    assert response.error == "OpenAI API timeout"

  def test_document_status_response_pending(self):
    """DocumentStatusResponse can be in PENDING state"""
    response = DocumentStatusResponse(
      task_id="task123",
      status="PENDING"
    )
    
    assert response.status == "PENDING"

  def test_document_status_response_in_progress(self):
    """DocumentStatusResponse can be in processing state"""
    created = datetime.now(timezone.utc)
    response = DocumentStatusResponse(
        task_id="task123",
        status="PROCESSING",
        created_at=created
    )
    
    assert response.status == "PROCESSING"
    assert response.created_at == created

  def test_document_status_response_serialization(self):
    """DocumentStatusResponse can be serialized"""
    response = DocumentStatusResponse(
        task_id="task789",
        status="COMPLETED",
        error=None
    )
    data = response.model_dump()
    
    assert data["task_id"] == "task789"
    assert data["status"] == "COMPLETED"

  def test_document_status_response_json_serialization(self):
    """DocumentStatusResponse can be serialized to JSON"""
    response = DocumentStatusResponse(
        task_id="task999",
        status="FAILED",
        error="Memory error"
    )
    json_str = response.model_dump_json()
    
    assert "task999" in json_str
    assert "FAILED" in json_str
    assert "Memory error" in json_str

class TestTaskItem:
  """Tests for TaskItem"""

  def test_task_item_valid_completed(self):
    """TaskItem accepts all fields"""
    now = datetime.now(timezone.utc)
    task = TaskItem(
        task_id="task123",
        status="COMPLETED",
        created_at=now,
        completed_at=now,
        error=None
    )
    
    assert task.task_id == "task123"
    assert task.status == "COMPLETED"
    assert task.created_at == now
    assert task.completed_at == now
    assert task.error is None

  def test_task_item_required_fields(self):
    """TaskItem requires task_id, status and created_at"""
    now = datetime.now(timezone.utc)
    with pytest.raises(ValidationError):
        TaskItem(task_id="task123", status="PENDING")

  def test_task_item_created_at_required(self):
    """TaskItem requires created_at"""
    with pytest.raises(ValidationError):
        TaskItem(
          task_id="task123",
          status="PENDING"
        )

  def test_task_item_optional_completed_at(self):
    """TaskItem completed_at is optional"""
    now = datetime.now(timezone.utc)
    task = TaskItem(
        task_id="task123",
        status="PENDING",
        created_at=now
    )
    
    assert task.completed_at is None
    assert task.error is None

  def test_task_item_with_error(self):
    """TaskItem can have error message"""
    now = datetime.now(timezone.utc)
    task = TaskItem(
        task_id="task123",
        status="FAILED",
        created_at=now,
        error="Processing failed"
    )
    
    assert task.error == "Processing failed"

  def test_task_item_pending_status(self):
    """TaskItem can be in PENDING status"""
    now = datetime.now(timezone.utc)
    task = TaskItem(
        task_id="task123",
        status="PENDING",
        created_at=now
    )
    
    assert task.status == "PENDING"
    assert task.completed_at is None

  def test_task_item_serialization(self):
    """TaskItem can be serialized"""
    now = datetime.now(timezone.utc)
    task = TaskItem(
        task_id="task456",
        status="COMPLETED",
        created_at=now,
        completed_at=now
    )
    data = task.model_dump()
    
    assert data["task_id"] == "task456"
    assert data["status"] == "COMPLETED"

  def test_task_item_json_serialization(self):
    """TaskItem can be serialized to JSON"""
    now = datetime.now(timezone.utc)
    task = TaskItem(
        task_id="task789",
        status="COMPLETED",
        created_at=now
    )
    json_str = task.model_dump_json()
    
    assert "task789" in json_str
    assert "COMPLETED" in json_str


class TestTaskSearchResponse:
    """Tests for TaskSearchResponse"""

    def test_task_search_response_valid_data(self):
        """TaskSearchResponse accepts valid data"""
        now = datetime.now(timezone.utc)
        tasks = [
            TaskItem(
                task_id="task1",
                status="COMPLETED",
                created_at=now,
                completed_at=now
            ),
            TaskItem(
                task_id="task2",
                status="PENDING",
                created_at=now
            )
        ]
        
        response = TaskSearchResponse(
            tasks=tasks,
            total=10,
            skip=0,
            limit=2,
            count=2
        )
        
        assert len(response.tasks) == 2
        assert response.total == 10
        assert response.skip == 0
        assert response.limit == 2
        assert response.count == 2

    def test_task_search_response_required_fields(self):
        """TaskSearchResponse requires all fields"""
        with pytest.raises(ValidationError):
            TaskSearchResponse(tasks=[], total=0)

    def test_task_search_response_empty_tasks(self):
        """TaskSearchResponse can have empty task list"""
        response = TaskSearchResponse(
            tasks=[],
            total=0,
            skip=0,
            limit=10,
            count=0
        )
        
        assert response.tasks == []
        assert response.total == 0
        assert response.count == 0

    def test_task_search_response_single_task(self):
        """TaskSearchResponse can have single task"""
        now = datetime.now(timezone.utc)
        task = TaskItem(
            task_id="task1",
            status="COMPLETED",
            created_at=now
        )
        
        response = TaskSearchResponse(
            tasks=[task],
            total=1,
            skip=0,
            limit=10,
            count=1
        )
        
        assert len(response.tasks) == 1
        assert response.count == 1

    def test_task_search_response_with_pagination(self):
        """TaskSearchResponse handles pagination"""
        now = datetime.now(timezone.utc)
        tasks = [
            TaskItem(task_id=f"task{i}", status="PENDING", created_at=now)
            for i in range(5)
        ]
        
        response = TaskSearchResponse(
            tasks=tasks,
            total=25,
            skip=5,
            limit=5,
            count=5
        )
        
        assert response.total == 25
        assert response.skip == 5
        assert response.count == 5

    def test_task_search_response_serialization(self):
        """TaskSearchResponse can be serialized"""
        now = datetime.now(timezone.utc)
        task = TaskItem(
            task_id="task1",
            status="COMPLETED",
            created_at=now
        )
        
        response = TaskSearchResponse(
            tasks=[task],
            total=1,
            skip=0,
            limit=10,
            count=1
        )
        data = response.model_dump()
        
        assert len(data["tasks"]) == 1
        assert data["total"] == 1

    def test_task_search_response_json_serialization(self):
        """TaskSearchResponse can be serialized to JSON"""
        now = datetime.now(timezone.utc)
        task = TaskItem(
            task_id="task1",
            status="COMPLETED",
            created_at=now
        )
        
        response = TaskSearchResponse(
            tasks=[task],
            total=1,
            skip=0,
            limit=10,
            count=1
        )
        json_str = response.model_dump_json()
        
        assert "task1" in json_str
        assert "COMPLETED" in json_str


class TestErrorResponse:
  """Tests for ErrorResponse"""

  def test_error_response_valid_data(self):
    """ErrorResponse accepts error message"""
    response = ErrorResponse(detail="Task not found")
    
    assert response.detail == "Task not found"

  def test_error_response_missing_detail(self):
    """ErrorResponse requires detail field"""
    with pytest.raises(ValidationError):
        ErrorResponse()

  def test_error_response_empty_detail(self):
    """ErrorResponse accepts empty detail"""
    response = ErrorResponse(detail="")
    
    assert response.detail == ""

  def test_error_response_long_detail(self):
    """ErrorResponse accepts long error message"""
    long_message = "A" * 1000
    response = ErrorResponse(detail=long_message)
    
    assert response.detail == long_message
    assert len(response.detail) == 1000

  def test_error_response_various_errors(self):
    """ErrorResponse handles various error messages"""
    errors = [
        "Database connection failed",
        "Invalid input data",
        "OpenAI API timeout",
        "Internal server error",
        "MongoDB query error"
    ]
    
    for error_msg in errors:
        response = ErrorResponse(detail=error_msg)
        assert response.detail == error_msg

  def test_error_response_serialization(self):
    """ErrorResponse can be serialized"""
    response = ErrorResponse(detail="Validation failed")
    data = response.model_dump()
    
    assert data["detail"] == "Validation failed"

  def test_error_response_json_serialization(self):
    """ErrorResponse can be serialized to JSON"""
    response = ErrorResponse(detail="Not authorized")
    json_str = response.model_dump_json()
    
    assert "Not authorized" in json_str

  def test_error_response_special_characters(self):
    """ErrorResponse handles special characters"""
    response = ErrorResponse(detail="Error: Expected 'value' but got \"other\"")
    
    assert response.detail == "Error: Expected 'value' but got \"other\""

  def test_error_response_newlines(self):
    """ErrorResponse handles newlines in message"""
    response = ErrorResponse(detail="Line 1\nLine 2\nLine 3")
    
    assert response.detail == "Line 1\nLine 2\nLine 3"