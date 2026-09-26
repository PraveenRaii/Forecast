from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .database import db
from .seed.seed_demo_data import seed_demo_data
from .api.routes.router import router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    if get_settings().data_mode == "demo": await seed_demo_data()
    yield
    await db.close()

app = FastAPI(title="Safar API", description="Smart Alert for Forecast Accuracy and Reliability", version="0.1.0", lifespan=lifespan)
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    # Vite is commonly opened at either hostname during local development.
    allow_origins=list({settings.frontend_url, "http://localhost:5173", "http://127.0.0.1:5173"}),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)
