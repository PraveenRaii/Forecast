from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .database import db
from .api.routes.router import router

settings = get_settings()

app = FastAPI(
    title="WeatherGuard AI",
    description="AI-Based NWP Forecast Confidence & Forecast Bust Detection System",
    version="2.4.0"
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

app.include_router(router)
