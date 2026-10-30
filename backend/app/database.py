"""Database persistence layer supporting SQLite with in-memory caching for ultra-low latency."""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import sqlite3
from typing import Any, Dict, List, Optional
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
    "settings",
    "forecasts"
]

class Database:
    def __init__(self):
        self.client = None
        self.db = None
        self.connected_mongo = False
        
        # Robust candidate search for weather_guard.db
        candidates = [
            Path(__file__).resolve().parents[2] / "weather_guard.db",
            Path(__file__).resolve().parents[1] / "weather_guard.db",
            Path.cwd() / "weather_guard.db",
            Path.cwd() / ".." / "weather_guard.db"
        ]
        self.sqlite_path = next((p for p in candidates if p.exists()), candidates[0])
        self.sqlite_conn: Optional[sqlite3.Connection] = None
        
        # High-performance in-memory cache
        self.cache: Dict[str, List[dict]] = {}
        self.initialized = False
        self._init_sqlite()

    def _init_sqlite(self):
        try:
            self.sqlite_conn = sqlite3.connect(
                str(self.sqlite_path),
                check_same_thread=False,
                timeout=10.0
            )
            self.sqlite_conn.execute("PRAGMA journal_mode=WAL;")
            self.sqlite_conn.execute("PRAGMA synchronous=NORMAL;")
            for col in COLLECTIONS:
                self.sqlite_conn.execute(f"""
                    CREATE TABLE IF NOT EXISTS {col} (
                        id TEXT PRIMARY KEY,
                        data TEXT NOT NULL,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
            self.sqlite_conn.commit()
            self._warm_cache()
            self.initialized = True
        except Exception as e:
            print(f"[Database] SQLite init error at {self.sqlite_path}: {e}")

    def _warm_cache(self):
        if not self.sqlite_conn:
            return
        try:
            warm_collections = [
                "regions",
                "model_metrics",
                "data_sources",
                "alerts",
                "confidence_scores",
                "forecast_errors",
                "forecasts",
                "settings"
            ]
            for col in warm_collections:
                cursor = self.sqlite_conn.cursor()
                rows = cursor.execute(f"SELECT data FROM {col} LIMIT 10000").fetchall()
                if rows:
                    self.cache[col] = [json.loads(r[0]) for r in rows]
        except Exception as e:
            print(f"[Database] Notice warming cache: {e}")

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
            # Update in-memory cache directly
            current = self.cache.get(collection, [])
            new_ids = {r[0] for r in records}
            kept = [item for item in current if str(item.get("id")) not in new_ids]
            self.cache[collection] = kept + documents
        except Exception as e:
            print(f"[Database] Error upserting into {collection}: {e}")

    async def all(self, collection: str, query: dict | None = None, limit: int = 5000) -> list[dict]:
        # Check in-memory cache first for sub-millisecond response
        items = self.cache.get(collection)
        if items is None and self.sqlite_conn:
            try:
                cursor = self.sqlite_conn.cursor()
                rows = cursor.execute(f"SELECT data FROM {collection} LIMIT 10000").fetchall()
                items = [json.loads(r[0]) for r in rows]
                self.cache[collection] = items
            except Exception as e:
                print(f"[Database] Error reading {collection}: {e}")
                return []

        if not items:
            return []

        if not query:
            return items[:limit]

        filtered = [
            d for d in items
            if all(
                str(d.get(k)) == str(v)
                if isinstance(v, (int, str)) and isinstance(d.get(k), (int, str))
                else d.get(k) == v
                for k, v in query.items()
            )
        ]
        return filtered[:limit]

    @property
    def connected(self) -> bool:
        return self.connected_mongo or (self.sqlite_conn is not None)

db = Database()
