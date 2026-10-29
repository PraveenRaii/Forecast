import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.database import db

async def main():
    print("Connecting db...", flush=True)
    await db.connect()
    print("Connected! Initialized:", db.initialized, flush=True)

if __name__ == "__main__":
    asyncio.run(main())
