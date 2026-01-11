from typing import List, Optional, Any
from datetime import datetime, timezone, timedelta
from pymongo import UpdateOne
from app.schemas.job_offer import JobOfferCreate, Company, Salary, Location
from app.clients.theirstack_client import theirstack_client

class JobOfferService:
    def __init__(self, db: Any):
        self.db = db
        self.collection = db["job_offers"]
        self.tz = timezone(timedelta(hours=1))

    async def sync_job_offers(self, page: int = 1, limit: int = 50) -> int:
        """
        Synchronize job offers with Theirstack API.
        """
        try:
            offers_data = await theirstack_client.get_job_offers(
                db=self.db,
                page=page,
                limit=limit
            )
            
            if not offers_data:
                print("No job offers returned from API")
                return 0

            operations = []
            for offer in offers_data:
                try:
                    company_obj = offer.get("company_object", {})
                    company = Company(
                        name=company_obj.get("name", "Unknown"),
                        country=company_obj.get("country"),
                        logo_url=company_obj.get("logo")
                    )
                    
                    salary = Salary(
                        min_annual_salary=offer.get("min_annual_salary_usd"),
                        max_annual_salary=offer.get("min_annual_salary_usd"),
                        salary_currency='USD'
                    )
                    
                    location = [
                        Location(
                            country_name=loc.get("country_name"),
                            display_name=loc.get("display_name")
                        ) for loc in offer.get("locations", [])
                    ]
                    
                    job_offer = JobOfferCreate(
                        external_id=offer.get("id"),
                        title=offer.get("job_title"),
                        company=company,
                        location=location,
                        description=offer.get("description"),
                        salary=salary,
                        source_url=offer.get("url"),
                        employment_statuses=offer.get("employment_statuses", []),
                        technology_slugs=offer.get("technology_slugs", []),
                        remote=offer.get("remote"),
                        hybrid=offer.get("hybrid"),
                        seniority=offer.get("seniority"),
                        date_posted=offer.get("date_posted")
                    )
                    
                    operations.append(
                        UpdateOne(
                            {"external_id": job_offer.external_id},
                            {
                                "$set": {
                                    **job_offer.model_dump(),
                                    "updated_at": datetime.now(self.tz)
                                },
                                "$setOnInsert": {"created_at": datetime.now(self.tz)}
                            },
                            upsert=True
                        )
                    )
                except Exception as e:
                    print(f"Error processing offer {offer.get('id')}: {e}")
                    continue

            if operations:
                result = await self.collection.bulk_write(operations)
                synced = len(result.upserted_ids) + result.modified_count
                print(f"Synced {synced} job offers")
                return synced

            return 0

        except Exception as e:
            print(f"Error syncing job offers: {e}")
            raise

    async def get_offers_for_user(self, user_preferences: dict) -> List[dict]:
        """Get job offers that fit user preferences"""
        query = {}

        if user_preferences.get("technology_slugs"):
            query["technology_slugs"] = {
                "$in": user_preferences["technology_slugs"]
            }

        if user_preferences.get("remote") is not None:
            query["remote"] = user_preferences["remote"]

        if user_preferences.get("hybrid") is not None:
            query["hybrid"] = user_preferences["hybrid"]

        if user_preferences.get("seniority_levels"):
            query["seniority"] = {
                "$in": user_preferences["seniority_levels"]
            }

        # if user_preferences.get("countries"):
        #     query["location.country_name"] = {
        #         "$in": user_preferences["countries"]
        #     }

        # if user_preferences.get("excluded_companies"):
        #     query["company.name"] = {
        #         "$nin": user_preferences["excluded_companies"]
        #     }

        cursor = self.collection.find(query).sort("date_posted", -1)
        offers = await cursor.to_list(length=None)
        for offer in offers:
            offer["id"] = str(offer["_id"])
            del offer["_id"]
        return offers

    async def get_all_offers(self, skip: int = 0, limit: int = 20) -> List[dict]:
        """Get all job offers"""
        cursor = self.collection.find({}).skip(skip).limit(limit).sort("date_posted", -1)
        offers = await cursor.to_list(length=limit)
        
        # Convert  _id na id
        for offer in offers:
            offer["id"] = str(offer["_id"])
            del offer["_id"]
        
        return offers

    async def count_offers(self) -> int:
        """Count offers"""
        return await self.collection.count_documents({})