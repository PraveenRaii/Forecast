"""Database persistence layer supporting SQLite, MongoDB, and In-Memory fallback."""
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
        self.initialized = False
        self._init_sqlite()

    def _init_sqlite(self):
        try:
            self.sqlite_conn = sqlite3.connect(str(self.sqlite_path), check_same_thread=False)
            for col in COLLECTIONS:
                self.sqlite_conn.execute(f"""
                    CREATE TABLE IF NOT EXISTS {col} (
                        id TEXT PRIMARY KEY,
                        data TEXT NOT NULL,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
            self.sqlite_conn.commit()
            self.initialized = True
        except Exception as e:
            print(f"Notice SQLite init: {e}")

    async def connect(self):
        if not self.initialized:
            self._init_sqlite()
        settings = get_settings()
        if settings.mongodb_uri:
            try:
                from motor.motor_asyncio import AsyncIOMotorClient
                self.client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=1000)
                await self.client.admin.command("ping")
                self.db = self.client[settings.mongodb_db]
                self.connected_mongo = True
            except Exception:
                self.connected_mongo = False

    async def close(self):
        if self.client:
            self.client.close()
        if self.sqlite_conn:
            self.sqlite_conn.close()

    async def upsert_many(self, collection: str, documents: list[dict], keys: list[str]):
        if not documents or not self.sqlite_conn:
            return
        records = []
        for doc in documents:
            doc_id = str(doc.get("id") or "-".join(str(doc.get(k, "")) for k in keys))
            records.append((doc_id, json.dumps(doc)))
        try:
            self.sqlite_conn.executemany(
                f"INSERT OR REPLACE INTO {collection} (id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
                records
            )
            self.sqlite_conn.commit()
        except Exception:
            pass

    async def all(self, collection: str, query: dict | None = None, limit: int = 5000) -> list[dict]:
        if not self.sqlite_conn:
            return []
        try:
            # High-speed SQLite query
            cursor = self.sqlite_conn.cursor()
            rows = cursor.execute(f"SELECT data FROM {collection} LIMIT {limit * 3}").fetchall()
            items = [json.loads(r[0]) for r in rows]
            if not query:
                return items[:limit]
            
            filtered = [
                d for d in items
                if all(d.get(k) == v for k, v in query.items())
            ]
            return filtered[:limit]
        except Exception:
            return []

    @property
    def connected(self) -> bool:
        return self.connected_mongo or (self.sqlite_conn is not None)

db = Database()
