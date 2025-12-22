from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o-mini"
    APP_NAME: str = "AI Service"

    MONGODB_URL: str
    MONGODB_DB: str

    ## Theirstack
    THEIRSTACK_API_KEY: str
    THEIRSTACK_API_URL: str


    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()