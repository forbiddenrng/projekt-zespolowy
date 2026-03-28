import pytest
import os
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timezone

from app.services.cover_letter_service import CoverLetterService


class TestCoverLetterService:
  """Test suite for CVService class"""

  @pytest.fixture
  def cover_letter_service(self, tmp_path):
    """Create CoverLetterService instance with temporary storage path"""
    with patch.dict(os.environ, {"COVER_LETTER_STORAGE_PATH": str(tmp_path / "cvs")}):
      service = CoverLetterService()
      yield service

  @pytest.fixture
  def sample_cover_letter_data(self):
    """Sample CV data for testing"""
    return {
      "name": "John Doe",
      "email": "john@example.com",
      "experience": [{"company": "Tech Corp", "position": "Software Engineer", "duration": "2 years"}],
      "skills": ["Python", "JavaScript", "React"]
    }

  @pytest.fixture
  def sample_html(self):
    """Sample HTML for testing"""
    return "<html><body><h1>John Doe</h1></body></html>"

    # ===== generate_cover_letter_html tests =====
    
  def test_generate_cover_letter_html_returns_string(self, cover_letter_service, sample_cover_letter_data):
    """Test that generate_cover_letter_html returns a string"""
    with patch('app.services.cover_letter_service.Environment') as mock_env_class:
      mock_template = Mock()
      mock_template.render.return_value = "<html>CV</html>"
      mock_env = Mock()
      mock_env.get_template.return_value = mock_template
      mock_env_class.return_value = mock_env

      result = cover_letter_service.generate_cover_letter_html(sample_cover_letter_data)

      assert isinstance(result, str)
      assert result == "<html>CV</html>"

  def test_generate_cover_letter_html_calls_template_render_with_cv_data(self, cover_letter_service, sample_cover_letter_data):
    """Test that template render is called with cv_data"""
    with patch('app.services.cover_letter_service.Environment') as mock_env_class:
      mock_template = Mock()
      mock_template.render.return_value = "<html>CV</html>"
      mock_env = Mock()
      mock_env.get_template.return_value = mock_template
      mock_env_class.return_value = mock_env

      cover_letter_service.generate_cover_letter_html(sample_cover_letter_data)

      mock_template.render.assert_called_once_with(sample_cover_letter_data)

  def test_generate_cover_letter_html_uses_correct_template_path(self, cover_letter_service, sample_cover_letter_data):
    """Test that FileSystemLoader is initialized with correct path"""
    with patch('app.services.cover_letter_service.FileSystemLoader') as mock_loader_class:
      with patch('app.services.cover_letter_service.Environment') as mock_env_class:
        mock_template = Mock()
        mock_template.render.return_value = "<html>CV</html>"
        mock_env = Mock()
        mock_env.get_template.return_value = mock_template
        mock_env_class.return_value = mock_env

        cover_letter_service.generate_cover_letter_html(sample_cover_letter_data)

        mock_loader_class.assert_called_once_with(searchpath="app/services")

  def test_generate_cover_letter_html_loads_template_file(self, cover_letter_service, sample_cover_letter_data):
    """Test that correct template file is loaded"""
    with patch('app.services.cover_letter_service.Environment') as mock_env_class:
      mock_template = Mock()
      mock_template.render.return_value = "<html>CV</html>"
      mock_env = Mock()
      mock_env.get_template.return_value = mock_template
      mock_env_class.return_value = mock_env

      cover_letter_service.generate_cover_letter_html(sample_cover_letter_data)

      mock_env.get_template.assert_called_once_with("cover_letter_template.html")

  def test_generate_cover_letter_html_with_empty_data(self, cover_letter_service):
    """Test generate_cover_letter_html with empty CV data"""
    with patch('app.services.cover_letter_service.Environment') as mock_env_class:
      mock_template = Mock()
      mock_template.render.return_value = "<html></html>"
      mock_env = Mock()
      mock_env.get_template.return_value = mock_template
      mock_env_class.return_value = mock_env

      result = cover_letter_service.generate_cover_letter_html({})

      assert isinstance(result, str)
      mock_template.render.assert_called_once_with({})

  # ===== _save_locally tests =====
  
  @pytest.mark.asyncio
  async def test_save_locally_creates_directory_structure(self, cover_letter_service, sample_html):
    """Test that _save_locally creates proper directory structure YYYY/MM/user_id"""
    user_id = "test_user_123"
    task_id = "task_456"

    with patch('app.services.cover_letter_service.HTML') as mock_html_class:
      mock_html_instance = Mock()
      mock_html_class.return_value = mock_html_instance

      result = await cover_letter_service._save_locally(user_id, task_id, sample_html)

      path_parts = result.split('/')
      assert len(path_parts) == 4  # YYYY/MM/user_id/task_id.pdf
      assert path_parts[0].isdigit() and len(path_parts[0]) == 4  # Year
      assert path_parts[1].isdigit() and len(path_parts[1]) == 2  # Month
      assert path_parts[2] == user_id
      # assert path_parts[3].endswith('.pdf')
      assert path_parts[3] == "task_456.pdf"

  @pytest.mark.asyncio
  async def test_save_locally_calls_html_write_pdf(self, cover_letter_service, sample_html):
    """Test that HTML().write_pdf is called with correct path"""
    user_id = "test_user"
    task_id = "test_task"

    with patch('app.services.cover_letter_service.HTML') as mock_html_class:
      mock_html_instance = Mock()
      mock_html_class.return_value = mock_html_instance

      await cover_letter_service._save_locally(user_id, task_id, sample_html)

      mock_html_class.assert_called_once_with(string=sample_html)
      mock_html_instance.write_pdf.assert_called_once()

  @pytest.mark.asyncio
  async def test_save_locally_uses_utc_timestamp(self, cover_letter_service, sample_html):
    """Test that _save_locally uses UTC timezone for date"""
    user_id = "test_user"
    task_id = "test_task"

    with patch('app.services.cover_letter_service.HTML') as mock_html_class:
      with patch('app.services.cover_letter_service.datetime') as mock_datetime:
        mock_now = datetime(2026, 3, 15, 12, 30, 0, tzinfo=timezone.utc)
        mock_datetime.now.return_value = mock_now
        mock_html_instance = Mock()
        mock_html_class.return_value = mock_html_instance

        result = await cover_letter_service._save_locally(user_id, task_id, sample_html)

        assert "2026/03" in result

  @pytest.mark.asyncio
  async def test_save_locally_returns_string(self, cover_letter_service, sample_html):
    """Test that _save_locally returns a string path"""
    with patch('app.services.cover_letter_service.HTML') as mock_html_class:
      mock_html_instance = Mock()
      mock_html_class.return_value = mock_html_instance

      result = await cover_letter_service._save_locally("user", "task", sample_html)

      assert isinstance(result, str)

  # ===== save_pdf tests =====
  
  @pytest.mark.asyncio
  async def test_save_pdf_delegates_to_save_locally(self, cover_letter_service, sample_html):
    """Test that save_pdf delegates to _save_locally"""
    user_id = "test_user"
    task_id = "test_task"

    with patch.object(cover_letter_service, '_save_locally', new_callable=AsyncMock) as mock_save_locally:
      mock_save_locally.return_value = "2026/03/test_user/test_task.pdf"

      result = await cover_letter_service.save_pdf(user_id, task_id, sample_html)

      mock_save_locally.assert_called_once_with(user_id, task_id, sample_html)
      assert result == "2026/03/test_user/test_task.pdf"

  @pytest.mark.asyncio
  async def test_save_pdf_returns_path_from_save_locally(self, cover_letter_service, sample_html):
    """Test that save_pdf returns the path from _save_locally"""
    user_id = "user_abc"
    task_id = "task_xyz"
    expected_path = "2026/03/user_abc/task_xyz.pdf"

    with patch.object(cover_letter_service, '_save_locally', new_callable=AsyncMock) as mock_save_locally:
      mock_save_locally.return_value = expected_path

      result = await cover_letter_service.save_pdf(user_id, task_id, sample_html)

      assert result == expected_path

  @pytest.mark.asyncio
  async def test_save_pdf_passes_correct_arguments(self, cover_letter_service, sample_html):
      """Test that save_pdf passes arguments correctly to _save_locally"""
      user_id = "user_123"
      task_id = "task_456"

      with patch.object(cover_letter_service, '_save_locally', new_callable=AsyncMock) as mock_save_locally:
        mock_save_locally.return_value = "2026/03/user_123/task_456.pdf"

        await cover_letter_service.save_pdf(user_id, task_id, sample_html)

        mock_save_locally.assert_called_once()
        call_args = mock_save_locally.call_args
        assert call_args[0][0] == user_id
        assert call_args[0][1] == task_id
        assert call_args[0][2] == sample_html

  # ===== _get_locally tests =====
  
  @pytest.mark.asyncio
  async def test_get_locally_reads_file_from_disk(self, cover_letter_service, mock_aiofiles_open):
    """Test that _get_locally reads PDF file from disk"""
    pdf_path = "2026/03/test_user/test_task.pdf"
    fake_pdf_content = b"%PDF-1.4 fake pdf content"

    with patch('app.services.cover_letter_service.aiofiles.open') as mock_open_func:
      async_cm, _ = mock_aiofiles_open(fake_pdf_content)     
      mock_open_func.return_value = async_cm

      result = await cover_letter_service._get_locally(pdf_path)

      assert result == fake_pdf_content

  @pytest.mark.asyncio
  async def test_get_locally_constructs_correct_file_path(self, cover_letter_service, mock_aiofiles_open):
    """Test that _get_locally uses correct full file path"""
    pdf_path = "2026/03/test_user/test_task.pdf"

    with patch('app.services.cover_letter_service.aiofiles.open') as mock_open_func:
      async_cm, _ = mock_aiofiles_open(b"content")   
      mock_open_func.return_value = async_cm

      await cover_letter_service._get_locally(pdf_path)

      expected_full_path = cover_letter_service.local_storage_path / pdf_path
      mock_open_func.assert_called_once()
      call_args = mock_open_func.call_args[0]
      assert str(expected_full_path) in str(call_args[0])

  @pytest.mark.asyncio
  async def test_get_locally_opens_file_in_binary_mode(self, cover_letter_service, mock_aiofiles_open):
      """Test that _get_locally opens file in binary read mode 'rb'"""
      pdf_path = "2026/03/test_user/test_task.pdf"

      with patch('app.services.cover_letter_service.aiofiles.open') as mock_open_func:
        async_cm, _ = mock_aiofiles_open(b"content")   
        mock_open_func.return_value = async_cm

        await cover_letter_service._get_locally(pdf_path)

        call_args = mock_open_func.call_args[0]
        assert call_args[1] == "rb"

  @pytest.mark.asyncio
  async def test_get_locally_returns_bytes(self, cover_letter_service, mock_aiofiles_open):
    """Test that _get_locally returns bytes"""
    pdf_path = "2026/03/test_user/test_task.pdf"
    fake_pdf = b"PDF content bytes"

    with patch('app.services.cover_letter_service.aiofiles.open') as mock_open_func:
      async_cm, _ = mock_aiofiles_open(fake_pdf)   
      mock_open_func.return_value = async_cm

      result = await cover_letter_service._get_locally(pdf_path)

      assert isinstance(result, bytes)
      assert result == fake_pdf

  @pytest.mark.asyncio
  async def test_get_locally_uses_async_file_operations(self, cover_letter_service, mock_aiofiles_open):
    """Test that _get_locally uses async file operations"""
    pdf_path = "2026/03/test_user/test_task.pdf"

    with patch('app.services.cover_letter_service.aiofiles.open') as mock_open_func:
      async_cm, mock_file = mock_aiofiles_open(b"content")   
      mock_open_func.return_value = async_cm

      await cover_letter_service._get_locally(pdf_path)

      mock_file.read.assert_called_once()

  # ===== get_pdf tests =====
    
  @pytest.mark.asyncio
  async def test_get_pdf_delegates_to_get_locally(self, cover_letter_service):
    """Test that get_pdf delegates to _get_locally"""
    pdf_path = "2026/03/test_user/test_task.pdf"
    fake_pdf = b"PDF content"

    with patch.object(cover_letter_service, '_get_locally') as mock_get_locally:
      mock_get_locally.return_value = fake_pdf

      result = await cover_letter_service.get_pdf(pdf_path)

      mock_get_locally.assert_called_once_with(pdf_path)
      assert result == fake_pdf

  @pytest.mark.asyncio
  async def test_get_pdf_returns_bytes(self, cover_letter_service):
    """Test that get_pdf returns bytes"""
    pdf_path = "2026/03/user/task.pdf"
    expected_content = b"PDF bytes content"

    with patch.object(cover_letter_service, '_get_locally') as mock_get_locally:
      mock_get_locally.return_value = expected_content

      result = await cover_letter_service.get_pdf(pdf_path)

      assert isinstance(result, bytes)
      assert result == expected_content

  @pytest.mark.asyncio
  async def test_get_pdf_passes_correct_path(self, cover_letter_service):
    """Test that get_pdf passes path correctly to _get_locally"""
    pdf_path = "2026/03/user_abc/task_xyz.pdf"

    with patch.object(cover_letter_service, '_get_locally', new_callable=AsyncMock) as mock_get_locally:
      mock_get_locally.return_value = b"content"

      await cover_letter_service.get_pdf(pdf_path)

      mock_get_locally.assert_called_once_with(pdf_path)

    # ===== Integration tests =====
    
  @pytest.mark.asyncio
  async def test_full_cover_letter_workflow(self, cover_letter_service, sample_cover_letter_data, mock_aiofiles_open):
    """Test complete workflow: generate HTML -> save PDF -> get PDF"""
    user_id = "integration_user"
    task_id = "integration_task"
    fake_pdf_content = b"generated PDF content"

    with patch('app.services.cover_letter_service.Environment') as mock_env_class:
      mock_template = Mock()
      html_output = "<html><body>CV</body></html>"
      mock_template.render.return_value = html_output
      mock_env = Mock()
      mock_env.get_template.return_value = mock_template
      mock_env_class.return_value = mock_env

      generated_html = cover_letter_service.generate_cover_letter_html(sample_cover_letter_data)
      assert generated_html == html_output

      with patch('app.services.cover_letter_service.HTML') as mock_html_class:
        mock_html_instance = Mock()
        mock_html_class.return_value = mock_html_instance

        pdf_path = await cover_letter_service.save_pdf(user_id, task_id, generated_html)
        assert user_id in pdf_path
        assert task_id in pdf_path
        assert pdf_path.endswith('.pdf')

        with patch('app.services.cover_letter_service.aiofiles.open', new_callable=AsyncMock) as mock_open_func:
          async_cm, mock_file = mock_aiofiles_open(fake_pdf_content)
          mock_open_func.return_value = async_cm

          retrieved_pdf = await cover_letter_service.get_pdf(pdf_path)
          assert retrieved_pdf == fake_pdf_content
          assert isinstance(retrieved_pdf, bytes)