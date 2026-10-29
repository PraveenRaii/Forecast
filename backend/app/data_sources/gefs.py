"""NOAA Global Ensemble Forecast System (GEFS) Adapter."""
from datetime import datetime, timezone
from typing import Any, Dict, List
from .base import NWPDataSource
from ..config import get_settings

class GEFSProvider(NWPDataSource):
    """Ensemble prediction system (31 members) for uncertainty quantification and ensemble spread."""
    def __init__(self):
        self.settings = get_settings()

    async def get_forecast(self, **kwargs) -> Dict[str, Any]:
        return {
            "model": "NOAA GEFS",
            "members": 31,
            "resolution": "0.50°",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    async def get_metadata(self) -> Dict[str, Any]:
        return {
            "model": "NOAA GEFS (Global Ensemble Forecast System)",
            "center": "NCEP / NOAA",
            "members": "31 perturbation members (1 control + 30 perturbed)",
            "grid_resolution": "0.50° x 0.50° (~50 km)",
            "forecast_range": "Day 1 to Day 16 (0 to 384 hours)",
            "primary_metric": "Ensemble Standard Deviation (Spread) indicating intrinsic flow unpredictability"
        }

    async def get_variables(self) -> List[Dict[str, Any]]:
        return [
            {"name": "Ensemble Mean 2m Temperature", "code": "TMP_mean", "unit": "°C"},
            {"name": "Ensemble Spread 2m Temperature", "code": "TMP_spread", "unit": "°C"},
            {"name": "Ensemble Mean Precipitation", "code": "APCP_mean", "unit": "mm"},
            {"name": "Ensemble Precipitation Spread", "code": "APCP_spread", "unit": "mm"},
            {"name": "Ensemble MSLP Spread", "code": "PRMSL_spread", "unit": "hPa"}
        ]

    async def get_status(self) -> Dict[str, Any]:
        return {
            "name": "NOAA GEFS Ensemble",
            "provider": "NCEP / NOAA NOMADS",
            "status": "LIVE CONNECTED" if self.settings.gefs_enabled and self.settings.data_mode == "live" else "READY (DEMO ENSEMBLE SPREAD)",
            "freshness": "Updated Every 6h",
            "resolution": "0.50°",
            "enabled": self.settings.gefs_enabled
        }

    async def get_forecast_runs(self) -> List[str]:
        return ["00Z", "06Z", "12Z", "18Z"]
