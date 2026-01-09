from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    OPENROUTER_API_KEY: str
    OPENROUTER_MODEL: str
    OPENROUTER_URL: str
    APP_NAME: str = "AI Service"

    MONGODB_URL: str
    MONGODB_DB: str

    ## Theirstack
    THEIRSTACK_API_KEY: str
    THEIRSTACK_API_URL: str

    USER_SERVICE_URL: str

    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    USER_SERVICE_WEBHOOK_URL: str = ""

    API_BASE_URL: str = "http://localhost:8000"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()