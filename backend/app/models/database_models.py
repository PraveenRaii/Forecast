"""SQLAlchemy Database Models for WeatherGuard AI."""
from datetime import datetime, timezone
import json
from typing import Any

# We support standard dict serialization and SQLite/PostgreSQL schemas
class WeatherGuardDB:
    """Internal database store supporting in-memory and SQLite/PostgreSQL schema patterns."""
    pass

# Model definitions for schema reference and typing
TABLES = [
    "users",
    "nwp_forecasts",
    "weather_observations",
    "forecast_errors",
    "forecast_confidence",
    "forecast_busts",
    "model_runs",
    "model_metrics",
    "regions",
    "data_sources",
    "alerts"
]
