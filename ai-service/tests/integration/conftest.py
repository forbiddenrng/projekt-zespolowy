import pytest
import sys
import os
from pathlib import Path
from tests.integration.test_health import wait_for_services

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# WAŻNE: Nie ustawiamy fake zmiennych dla integracyjnych!
# Zamiast tego czytamy z docker-compose.test.yml lub zmiennych systemowych
# os.environ.setdefault("MONGODB_URL", "mongodb://test_admin:test_password@localhost:27018/ai_service_test?authSource=admin")
# os.environ.setdefault("MONGODB_DB", "ai_service_test")
# os.environ.setdefault("USER_SERVICE_URL", "http://localhost:5051")
# os.environ.setdefault("AI_SERVICE_URL", "http://localhost:8001")

pytest_plugins = ['tests.integration.test_health']