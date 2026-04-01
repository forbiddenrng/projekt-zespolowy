import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import json
from app.clients.openai_client import generate_cv_data, generate_cover_letter_data
from app.core.config import settings


class TestGenerateCVData:
  """Test suite for generate_cv_data function"""

  @pytest.mark.asyncio
  async def test_generate_cv_data_success(self):
    """Test successful CV data generation"""
    # Mock data
    user_info = {
      "name": "John Doe",
      "profile_summary": "Experienced developer",
      "skills": ["Python", "JavaScript"],
      "experience": [{"position": "Developer", "company": "Tech Corp"}]
    }
    job_offer = "Senior Python Developer"
    
    # Expected API response
    expected_response = {
      "summary": "I am an experienced developer",
      "quick_summary": "Python Developer | Backend Engineer",
      "links": [{"linkString": "https://linkedin.com/in/johndoe", "name": "LinkedIn"}]
    }
    
    with patch('app.clients.openai_client.client') as mock_client:
      # Mock the API response
      mock_response = MagicMock()
      mock_response.choices = [MagicMock()]
      mock_response.choices[0].message.content = json.dumps(expected_response)
      
      mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
      
      # Execute
      result = await generate_cv_data(user_info, job_offer)
      
      # Assertions
      assert result == expected_response
      mock_client.chat.completions.create.assert_called_once()
      
      # Verify API was called with correct parameters
      call_args = mock_client.chat.completions.create.call_args
      assert call_args.kwargs['model'] == settings.OPENROUTER_MODEL
      assert call_args.kwargs['temperature'] == 0.7
      assert call_args.kwargs['response_format']['type'] == 'json_object'
      assert len(call_args.kwargs['messages']) == 2
      assert call_args.kwargs['messages'][0]['role'] == 'system'
      assert call_args.kwargs['messages'][1]['role'] == 'user'

  @pytest.mark.asyncio
  async def test_generate_cv_data_with_dict_user_info(self):
    """Test CV data generation converts dict user_info to JSON string"""
    user_info = {"name": "Jane Doe", "email": "jane@example.com"}
    job_offer = "Frontend Developer"
    
    expected_response = {
        "summary": "Frontend specialist",
        "quick_summary": "React Developer",
        "links": []
    }
    
    with patch('app.clients.openai_client.client') as mock_client:
      mock_response = MagicMock()
      mock_response.choices = [MagicMock()]
      mock_response.choices[0].message.content = json.dumps(expected_response)
      mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
      
      result = await generate_cv_data(user_info, job_offer)
      
      assert result == expected_response
      
      # Verify user_info was converted to JSON in the prompt
      call_args = mock_client.chat.completions.create.call_args
      prompt = call_args.kwargs['messages'][1]['content']
      assert isinstance(prompt, str)
      # User info should be serialized in the prompt
      assert "jane@example.com" in prompt or "Jane Doe" in prompt

  @pytest.mark.asyncio
  async def test_generate_cv_data_empty_response_raises_error(self):
    """Test that empty API response raises ValueError"""
    user_info = {"name": "John"}
    job_offer = "Developer"
    
    with patch('app.clients.openai_client.client') as mock_client:
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = ""  # Empty response
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        with pytest.raises(ValueError, match="OpenRouter API returned empty response"):
            await generate_cv_data(user_info, job_offer)

  @pytest.mark.asyncio
  async def test_generate_cv_data_invalid_json_raises_error(self):
    """Test that invalid JSON response raises ValueError"""
    user_info = {"name": "John"}
    job_offer = "Developer"
    
    with patch('app.clients.openai_client.client') as mock_client:
      mock_response = MagicMock()
      mock_response.choices = [MagicMock()]
      mock_response.choices[0].message.content = "This is not valid JSON {{"
      mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
      
      with pytest.raises(ValueError, match="Invalid JSON response from API"):
          await generate_cv_data(user_info, job_offer)

  @pytest.mark.asyncio
  async def test_generate_cv_data_with_string_user_info(self):
      """Test CV data generation with string user_info"""
      user_info = "John Doe is a Python developer"
      job_offer = "Senior Python Developer"
      
      expected_response = {
          "summary": "Professional developer",
          "quick_summary": "Python Dev",
          "links": []
      }
      
      with patch('app.clients.openai_client.client') as mock_client:
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = json.dumps(expected_response)
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        result = await generate_cv_data(user_info, job_offer)
        
        assert result == expected_response


class TestGenerateCoverLetterData:
  """Test suite for generate_cover_letter_data function"""

  @pytest.mark.asyncio
  async def test_generate_cover_letter_data_success(self):
    """Test successful cover letter data generation"""
    user_info = {
        "name": "John Doe",
        "skills": ["Python", "JavaScript"],
        "experience": [{"position": "Developer"}]
    }
    job_offer = "Senior Python Developer"
    company_info = "Tech Innovation Company"
    
    expected_response = {
        "salutation": "Szanowni Państwo,",
        "introduction": "piszę aby wyrazić zainteresowanie ofertą pracy na stanowisko Senior Python Developer.",
        "body": "W trakcie mojej pracy osiągnąłem wiele pozytywnych rezultatów. Jestem pewny że moja wiedza może przynieść wartość do Waszej firmy.",
        "closing": "Uprzejmie dziękuję za czas poświęcony na rozpatrzenie mojej aplikacji.",
        "signature": "Z wyrazami szacunku, John Doe"
    }
    
    with patch('app.clients.openai_client.client') as mock_client:
      mock_response = MagicMock()
      mock_response.choices = [MagicMock()]
      mock_response.choices[0].message.content = json.dumps(expected_response)
      mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
      
      result = await generate_cover_letter_data(user_info, job_offer, company_info)
      
      assert result == expected_response
      mock_client.chat.completions.create.assert_called_once()
      
      # Verify API was called with correct parameters
      call_args = mock_client.chat.completions.create.call_args
      assert call_args.kwargs['model'] == settings.OPENROUTER_MODEL
      assert call_args.kwargs['temperature'] == 0.7
      assert call_args.kwargs['response_format']['type'] == 'json_object'

  @pytest.mark.asyncio
  async def test_generate_cover_letter_data_missing_salutation_raises_error(self):
    """Test that missing salutation field raises ValueError"""
    user_info = {"name": "John"}
    job_offer = "Developer"
    company_info = "Tech Corp"
    
    # Response missing 'salutation' field
    invalid_response = {
        "introduction": "intro",
        "body": "body",
        "closing": "closing",
        "signature": "signature"
    }
    
    with patch('app.clients.openai_client.client') as mock_client:
      mock_response = MagicMock()
      mock_response.choices = [MagicMock()]
      mock_response.choices[0].message.content = json.dumps(invalid_response)
      mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
      
      with pytest.raises(ValueError, match="Missing or empty required fields"):
        await generate_cover_letter_data(user_info, job_offer, company_info)

  @pytest.mark.asyncio
  async def test_generate_cover_letter_data_missing_introduction_raises_error(self):
    """Test that missing introduction field raises ValueError"""
    user_info = {"name": "John"}
    job_offer = "Developer"
    company_info = "Tech Corp"
    
    invalid_response = {
        "salutation": "Szanowni Państwo,",
        "body": "body",
        "closing": "closing",
        "signature": "signature"
    }
    
    with patch('app.clients.openai_client.client') as mock_client:
      mock_response = MagicMock()
      mock_response.choices = [MagicMock()]
      mock_response.choices[0].message.content = json.dumps(invalid_response)
      mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
      
      with pytest.raises(ValueError, match="Missing or empty required fields"):
        await generate_cover_letter_data(user_info, job_offer, company_info)

  @pytest.mark.asyncio
  async def test_generate_cover_letter_data_missing_body_raises_error(self):
    """Test that missing body field raises ValueError"""
    user_info = {"name": "John"}
    job_offer = "Developer"
    company_info = "Tech Corp"
    
    invalid_response = {
        "salutation": "Szanowni Państwo,",
        "introduction": "intro",
        "closing": "closing",
        "signature": "signature"
    }
    
    with patch('app.clients.openai_client.client') as mock_client:
      mock_response = MagicMock()
      mock_response.choices = [MagicMock()]
      mock_response.choices[0].message.content = json.dumps(invalid_response)
      mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
      
      with pytest.raises(ValueError, match="Missing or empty required fields"):
        await generate_cover_letter_data(user_info, job_offer, company_info)

  @pytest.mark.asyncio
  async def test_generate_cover_letter_data_missing_closing_raises_error(self):
    """Test that missing closing field raises ValueError"""
    user_info = {"name": "John"}
    job_offer = "Developer"
    company_info = "Tech Corp"
    
    invalid_response = {
        "salutation": "Szanowni Państwo,",
        "introduction": "intro",
        "body": "body",
        "signature": "signature"
    }
    
    with patch('app.clients.openai_client.client') as mock_client:
      mock_response = MagicMock()
      mock_response.choices = [MagicMock()]
      mock_response.choices[0].message.content = json.dumps(invalid_response)
      mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
      
      with pytest.raises(ValueError, match="Missing or empty required fields"):
        await generate_cover_letter_data(user_info, job_offer, company_info)

  @pytest.mark.asyncio
  async def test_generate_cover_letter_data_missing_signature_raises_error(self):
    """Test that missing signature field raises ValueError"""
    user_info = {"name": "John"}
    job_offer = "Developer"
    company_info = "Tech Corp"
    
    invalid_response = {
        "salutation": "Szanowni Państwo,",
        "introduction": "intro",
        "body": "body",
        "closing": "closing"
    }
    
    with patch('app.clients.openai_client.client') as mock_client:
      mock_response = MagicMock()
      mock_response.choices = [MagicMock()]
      mock_response.choices[0].message.content = json.dumps(invalid_response)
      mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
      
      with pytest.raises(ValueError, match="Missing or empty required fields"):
        await generate_cover_letter_data(user_info, job_offer, company_info)

  @pytest.mark.asyncio
  async def test_generate_cover_letter_data_empty_field_raises_error(self):
    """Test that empty field value raises ValueError"""
    user_info = {"name": "John"}
    job_offer = "Developer"
    company_info = "Tech Corp"
    
    # Response with empty salutation
    invalid_response = {
        "salutation": "",
        "introduction": "intro",
        "body": "body",
        "closing": "closing",
        "signature": "signature"
    }
    
    with patch('app.clients.openai_client.client') as mock_client:
      mock_response = MagicMock()
      mock_response.choices = [MagicMock()]
      mock_response.choices[0].message.content = json.dumps(invalid_response)
      mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
      
      with pytest.raises(ValueError, match="Missing or empty required fields"):
        await generate_cover_letter_data(user_info, job_offer, company_info)

  @pytest.mark.asyncio
  async def test_generate_cover_letter_data_none_field_raises_error(self):
    """Test that None field value raises ValueError"""
    user_info = {"name": "John"}
    job_offer = "Developer"
    company_info = "Tech Corp"
    
    invalid_response = {
        "salutation": None,
        "introduction": "intro",
        "body": "body",
        "closing": "closing",
        "signature": "signature"
    }
    
    with patch('app.clients.openai_client.client') as mock_client:
      mock_response = MagicMock()
      mock_response.choices = [MagicMock()]
      mock_response.choices[0].message.content = json.dumps(invalid_response)
      mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
      
      with pytest.raises(ValueError, match="Missing or empty required fields"):
        await generate_cover_letter_data(user_info, job_offer, company_info)

  @pytest.mark.asyncio
  async def test_generate_cover_letter_data_empty_api_response_raises_error(self):
    """Test that empty API response raises ValueError"""
    user_info = {"name": "John"}
    job_offer = "Developer"
    company_info = "Tech Corp"
    
    with patch('app.clients.openai_client.client') as mock_client:
      mock_response = MagicMock()
      mock_response.choices = [MagicMock()]
      mock_response.choices[0].message.content = ""
      mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
      
      with pytest.raises(ValueError, match="OpenRouter API returned empty response"):
        await generate_cover_letter_data(user_info, job_offer, company_info)

  @pytest.mark.asyncio
  async def test_generate_cover_letter_data_invalid_json_raises_error(self):
    """Test that invalid JSON response raises ValueError"""
    user_info = {"name": "John"}
    job_offer = "Developer"
    company_info = "Tech Corp"
    
    with patch('app.clients.openai_client.client') as mock_client:
      mock_response = MagicMock()
      mock_response.choices = [MagicMock()]
      mock_response.choices[0].message.content = "Invalid {JSON"
      mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
      
      with pytest.raises(ValueError, match="Invalid JSON response from API"):
        await generate_cover_letter_data(user_info, job_offer, company_info)

  @pytest.mark.asyncio
  async def test_generate_cover_letter_data_with_dict_user_info(self):
    """Test cover letter generation converts dict user_info to JSON string"""
    user_info = {"name": "Jane Doe", "company": "Tech Corp"}
    job_offer = "Frontend Developer"
    company_info = "Innovation Inc"
    
    expected_response = {
        "salutation": "Szanowni Państwo,",
        "introduction": "intro",
        "body": "body",
        "closing": "closing",
        "signature": "Z wyrazami szacunku, Jane Doe"
    }
    
    with patch('app.clients.openai_client.client') as mock_client:
      mock_response = MagicMock()
      mock_response.choices = [MagicMock()]
      mock_response.choices[0].message.content = json.dumps(expected_response)
      mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
      
      result = await generate_cover_letter_data(user_info, job_offer, company_info)
      
      assert result == expected_response
      
      # Verify user_info was converted to JSON in the prompt
      call_args = mock_client.chat.completions.create.call_args
      prompt = call_args.kwargs['messages'][1]['content']
      assert isinstance(prompt, str)
      assert "Jane Doe" in prompt or "Tech Corp" in prompt


      