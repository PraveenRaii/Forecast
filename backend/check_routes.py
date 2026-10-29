import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import asyncio
import httpx
from app.main import app

async def test():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        r1 = await client.get("/api/health")
        print("GET /api/health:", r1.status_code, r1.text)
        
        r2 = await client.get("/api/dashboard/summary?lead_time=1")
        print("GET /api/dashboard/summary:", r2.status_code, r2.text[:120])
        
        r3 = await client.get("/api/confidence-map?lead_time=1")
        print("GET /api/confidence-map:", r3.status_code, r3.text[:120])
        
        r4 = await client.get("/dashboard/summary?lead_time=1")
        print("GET /dashboard/summary (WITHOUT /api):", r4.status_code)

asyncio.run(test())
