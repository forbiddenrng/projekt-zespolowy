from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o-mini"
    APP_NAME: str = "AI Service"

    ## MongoDB
    MONGODB_URL: str = "mongodb://admin:password@localhost:27017"
    MONGODB_DB: str = "ai-service"

    ## Theirstack
    THEIRSTACK_API_KEY: str
    THEIRSTACK_API_URL: str


    class Config:
        env_file = ".env"

settings = Settings()