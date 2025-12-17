from motor.motor_asyncio import AsyncClient, AsyncDatabase
from app.core.config import settings

class MongoDBClient:
    client: AsyncClient = None
    db: AsyncDatabase = None

    @classmethod
    async def connect_db(cls):
        cls.client = AsyncClient(settings.MONGODB_URL)
        cls.db = cls.client[settings.MONGODB_DB]
        # Utwórz indeksy
        await cls.db["job_offers"].create_index("external_id", unique=True)
        print("✓ Connected to MongoDB")

    @classmethod
    async def close_db(cls):
        if cls.client:
            cls.client.close()
            print("✓ Disconnected from MongoDB")

    @classmethod
    def get_db(cls) -> AsyncDatabase:
        return cls.db

mongodb = MongoDBClient()