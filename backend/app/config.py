from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[1]

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")
    app_name: str = "WeatherGuard AI"
    app_version: str = "2.4.0"
    data_mode: str = "live"  # 'demo' or 'live'
    database_url: str = "sqlite:///./weather_guard.db"
    mongodb_uri: str | None = None
    mongodb_db: str = "weather_guard"
    default_nwp_model: str = "GFS"
    default_lead_time: int = 1
    confidence_threshold: int = 50
    bust_percentile: int = 90
    nomads_enabled: bool = True
    nomads_base_url: str = "https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl"
    ecmwf_enabled: bool = False
    ecmwf_api_key: str | None = None
    era5_enabled: bool = False
    cds_api_key: str | None = None
    gefs_enabled: bool = True
    frontend_url: str = "http://localhost:5173"
    ml_model_path: str = "./ml_models"

@lru_cache
def get_settings() -> Settings:
    return Settings()
