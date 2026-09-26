from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[1]

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")
    mongodb_uri: str | None = None
    mongodb_db: str = "weather_guard"
    data_mode: str = "demo"
    nomads_enabled: bool = True
    nomads_base_url: str = "https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl"
    ecmwf_enabled: bool = False
    ecmwf_api_key: str | None = None
    bust_percentile: int = 90
    frontend_url: str = "http://localhost:5173"
    ml_model_path: str = "./ml_models"

@lru_cache
def get_settings() -> Settings:
    return Settings()
