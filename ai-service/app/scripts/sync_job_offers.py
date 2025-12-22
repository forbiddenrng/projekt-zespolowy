"""
CLI script to synchronize job offers from Theirstack API
Usage: python -m scripts.sync_job_offers --page 1 --limit 50
"""

import asyncio
import argparse
import sys
from pathlib import Path
from datetime import datetime, timezone

# Dodaj root do path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.job_offer_service import JobOfferService
from app.clients.mongodb_client import mongodb
from app.core.config import settings


async def main(page: int = 1, limit: int = 50):
    """
    Synchronize job offers
    
    Args:
        page: API Page
        limit: Job number limit
    """
    print(f"Starting job offers sync at {datetime.now(timezone.utc).isoformat()}")
    print(f"Parameters: page={page}, limit={limit}")
    
    try:
        # connect with db
        await mongodb.connect_db()
        db = mongodb.get_db()
        
        if db is None:
            print("Failed to connect to database")
            sys.exit(1)
        
        # Sync
        service = JobOfferService(db)
        
        synced = await service.sync_job_offers(page=page, limit=limit)
        
        print(f"\nSync completed successfully")
        print(f"Synced: {synced} offers")
        
        return synced
        
    except Exception as e:
        print(f"Error during sync: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return -1
        
    finally:
        await mongodb.close_db()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Synchronize job offers from Theirstack API"
    )
    parser.add_argument(
        "--page",
        type=int,
        default=1,
        help="API page number (default: 1)"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=50,
        help="Offers per page (default: 50, max: 50)"
    )
    
    args = parser.parse_args()
    
    result = asyncio.run(main(
        page=args.page,
        limit=args.limit,
    ))
    
    sys.exit(0 if result >= 0 else 1)