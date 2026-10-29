"""Database persistence layer supporting SQLite, MongoDB, and In-Memory fallback."""
import asyncio
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import sqlite3
from typing import Any, Dict, List
from .config import get_settings

COLLECTIONS = [
    "users",
    "nwp_forecasts",
    "weather_observations",
    "forecast_errors",
    "confidence_scores",
    "forecast_busts",
    "model_runs",
    "model_metrics",
    "regions",
    "data_sources",
    "alerts",
    "settings"
]

class Database:
    def __init__(self):
        self.client = None
        self.db = None
        self.connected_mongo = False
        self.sqlite_path = Path(__file__).resolve().parents[2] / "weather_guard.db"
        self.sqlite_conn = None
        # O(1) in-memory fast indexing: collection -> {doc_id: doc}
        self.memory: Dict[str, Dict[str, dict]] = {name: {} for name in COLLECTIONS}
        self.initialized = False

    async def connect(self):
        settings = get_settings()
        
        # 1. Initialize SQLite storage for local reliable persistence
        try:
            self.sqlite_conn = sqlite3.connect(str(self.sqlite_path), check_same_thread=False)
            self._init_sqlite_tables()
            self._load_from_sqlite()
        except Exception as e:
            print(f"Notice: SQLite fallback: {e}")

        # 2. Check MongoDB if configured
        if settings.mongodb_uri:
            try:
                from motor.motor_asyncio import AsyncIOMotorClient
                self.client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=1000)
                await self.client.admin.command("ping")
                self.db = self.client[settings.mongodb_db]
                self.connected_mongo = True
            except Exception:
                self.connected_mongo = False
                if self.client:
                    self.client.close()
                    self.client = None

        self.initialized = True

    def _init_sqlite_tables(self):
        if not self.sqlite_conn:
            return
        for col in COLLECTIONS:
            self.sqlite_conn.execute(f"""
                CREATE TABLE IF NOT EXISTS {col} (
                    id TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        self.sqlite_conn.commit()

    def _load_from_sqlite(self):
        if not self.sqlite_conn:
            return
        try:
            for col in COLLECTIONS:
                rows = self.sqlite_conn.execute(f"SELECT id, data FROM {col}").fetchall()
                if rows:
                    self.memory[col] = {r[0]: json.loads(r[1]) for r in rows}
        except Exception:
            pass

    async def close(self):
        if self.client:
            self.client.close()
        if self.sqlite_conn:
            self.sqlite_conn.close()

    async def upsert_many(self, collection: str, documents: list[dict], keys: list[str]):
        if not documents:
            return

        # Update in-memory index
        col_store = self.memory.setdefault(collection, {})
        sqlite_records = []
        for doc in documents:
            doc_id = str(doc.get("id") or "-".join(str(doc.get(k, "")) for k in keys))
            col_store[doc_id] = doc
            if self.sqlite_conn:
                sqlite_records.append((doc_id, json.dumps(doc)))

        # Bulk SQLite insert
        if self.sqlite_conn and sqlite_records:
            try:
                self.sqlite_conn.executemany(
                    f"INSERT OR REPLACE INTO {collection} (id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
                    sqlite_records
                )
                self.sqlite_conn.commit()
            except Exception:
                pass

        # Persist to MongoDB if connected
        if self.connected_mongo and self.db:
            try:
                from pymongo import UpdateOne
                ops = [UpdateOne({key: doc.get(key) for key in keys}, {"$set": doc}, upsert=True) for doc in documents]
                if ops:
                    await self.db[collection].bulk_write(ops)
            except Exception:
                pass

    async def all(self, collection: str, query: dict | None = None, limit: int = 5000) -> list[dict]:
        query = query or {}
        items = list(self.memory.get(collection, {}).values())
        if not query:
            return items[:limit]
        
        filtered = [
            d for d in items
            if all(d.get(k) == v for k, v in query.items())
        ]
        return filtered[:limit]

    @property
    def connected(self) -> bool:
        return self.connected_mongo or (self.sqlite_conn is not None)

db = Database()
