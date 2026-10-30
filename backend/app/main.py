from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .database import db
from .api.routes.router import router

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize and warm database cache on server start
    await db.connect()
    yield
    await db.close()

app = FastAPI(
    title="WeatherGuard AI",
    description="AI-Based NWP Forecast Confidence & Forecast Bust Detection System",
    version="2.4.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list({
        settings.frontend_url,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    }),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Support both /api/endpoint and /endpoint for maximum compatibility
app.include_router(router, prefix="/api")
app.include_router(router)
