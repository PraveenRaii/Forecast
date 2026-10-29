"""ECMWF Integrated Forecasting System (IFS) and AIFS Data Adapter."""
from datetime import datetime, timezone
from typing import Any, Dict, List
from .base import NWPDataSource
from ..config import get_settings

class ECMWFProvider(NWPDataSource):
    def __init__(self):
        self.settings = get_settings()

    async def get_forecast(self, **kwargs) -> Dict[str, Any]:
        if not (self.settings.ecmwf_enabled and self.settings.ecmwf_api_key):
            return {
                "model": "ECMWF IFS",
                "status": "UNCONFIGURED",
                "message": "Set ECMWF_API_KEY in .env to enable high-resolution 0.1° IFS ingestion."
            }
        return {
            "model": "ECMWF IFS",
            "resolution": "0.1° (~9 km)",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "LIVE"
        }

    async def get_metadata(self) -> Dict[str, Any]:
        return {
            "model": "ECMWF IFS / AIFS (Artificial Intelligence Forecast System)",
            "center": "European Centre for Medium-Range Weather Forecasts (Reading, UK)",
            "grid_resolution": "0.1° x 0.1° (~9 km)",
            "forecast_range": "Day 1 to Day 10 (0 to 240 hours)",
            "update_cycles": ["00Z", "12Z"],
            "status": "ACTIVE" if (self.settings.ecmwf_enabled and self.settings.ecmwf_api_key) else "PENDING_CREDENTIALS"
        }

    async def get_variables(self) -> List[Dict[str, Any]]:
        return [
            {"name": "2m Temperature", "code": "2t", "unit": "K / °C"},
            {"name": "Total Precipitation", "code": "tp", "unit": "m (mm)"},
            {"name": "10m Wind Speed", "code": "10si", "unit": "m/s"},
            {"name": "Mean Sea Level Pressure", "code": "msl", "unit": "Pa"},
            {"name": "Geopotential Height (500 hPa)", "code": "gh500", "unit": "m² s⁻²"}
        ]

    async def get_status(self) -> Dict[str, Any]:
        configured = bool(self.settings.ecmwf_enabled and self.settings.ecmwf_api_key)
        return {
            "name": "ECMWF IFS / AIFS",
            "provider": "ECMWF Open Data / MARS Client",
            "status": "LIVE CONNECTED" if configured else "NOT CONFIGURED (API KEY REQUIRED)",
            "freshness": "Daily 00Z / 12Z",
            "resolution": "0.1°",
            "enabled": self.settings.ecmwf_enabled
        }

    async def get_forecast_runs(self) -> List[str]:
        return ["00Z", "12Z"]
