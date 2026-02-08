from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from typing import Any
import logging

logger = logging.getLogger(__name__)

class MongoDBClient:
    client: Any = None
    db: Any = None

    @classmethod
    async def connect_db(cls):
        try:
            url = settings.MONGODB_URL

            masked_url = url.split("@")[-1] if "@" in url else url
            logger.info(f"Attempting to connect to: {masked_url}")

            cls.client = AsyncIOMotorClient(url)
            cls.db = cls.client[settings.MONGODB_DB]
            
            await cls.client.admin.command('ping')
            
            await cls.db["job_offers"].create_index("external_id", unique=True)
            logger.info("Successfully connected to MongoDB Atlas")
        except Exception as e:
            logger.error(f"MongoDB connection error: {str(e)}")
            raise e

    @classmethod
    async def close_db(cls):
        if cls.client:
            cls.client.close()
            print("Disconnected from MongoDB")

    @classmethod
    def get_db(cls) -> Any:
        return cls.db

mongodb = MongoDBClient()