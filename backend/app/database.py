"""Mongo persistence with a transparent in-memory fallback for demo mode."""
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from .config import get_settings

COLLECTIONS = ["forecasts", "observations", "forecast_errors", "confidence_scores", "forecast_busts", "regions", "model_metrics", "nwp_runs", "data_sources", "alerts"]

class Database:
    def __init__(self):
        self.client = None
        self.db = None
        self.connected = False
        self.memory: dict[str, list[dict]] = {name: [] for name in COLLECTIONS}

    async def connect(self):
        settings = get_settings()
        if not settings.mongodb_uri:
            return
        try:
            self.client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=3000)
            await self.client.admin.command("ping")
            self.db = self.client[settings.mongodb_db]
            self.connected = True
            await self._create_indexes()
        except Exception:
            self.connected = False
            if self.client:
                self.client.close()
                self.client = None

    async def _create_indexes(self):
        for name in ["forecasts", "observations", "forecast_errors", "confidence_scores", "forecast_busts"]:
            await self.db[name].create_index([("timestamp", -1), ("latitude", 1), ("longitude", 1)])
            await self.db[name].create_index([("model", 1), ("lead_time", 1), ("region", 1), ("forecast_run", 1)])
        await self.db.nwp_runs.create_index([("model", 1), ("run_time", 1)], unique=True)

    async def close(self):
        if self.client: self.client.close()

    async def upsert_many(self, collection: str, documents: list[dict], keys: list[str]):
        if self.connected:
            from pymongo import UpdateOne
            ops = [UpdateOne({key: doc.get(key) for key in keys}, {"$set": doc}, upsert=True) for doc in documents]
            if ops: await self.db[collection].bulk_write(ops)
        else:
            existing = self.memory[collection]
            for doc in documents:
                match = next((item for item in existing if all(item.get(key) == doc.get(key) for key in keys)), None)
                if match: match.update(doc)
                else: existing.append(doc)

    async def all(self, collection: str, query: dict | None = None, limit: int = 1000):
        query = query or {}
        if self.connected:
            return [doc async for doc in self.db[collection].find(query, {"_id": 0}).limit(limit)]
        return [d for d in self.memory[collection] if all(d.get(k) == v for k, v in query.items())][:limit]

db = Database()
