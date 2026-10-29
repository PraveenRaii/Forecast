"""NOAA Global Forecast System (GFS 0.25°) Data Adapter."""
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional
import httpx
from .base import NWPDataSource
from ..config import get_settings

GFS_VARIABLES = [
    {"name": "2m Temperature", "code": "TMP", "level": "2_m_above_ground", "unit": "K / °C", "description": "Temperature at 2m height"},
    {"name": "2m Dew Point", "code": "DPT", "level": "2_m_above_ground", "unit": "K / °C", "description": "Dew point temperature at 2m"},
    {"name": "Surface Pressure", "code": "PRES", "level": "surface", "unit": "Pa / hPa", "description": "Atmospheric surface pressure"},
    {"name": "Mean Sea Level Pressure", "code": "PRMSL", "level": "mean_sea_level", "unit": "Pa / hPa", "description": "Barometric pressure reduced to MSL"},
    {"name": "10m U Wind", "code": "UGRD", "level": "10_m_above_ground", "unit": "m/s", "description": "Zonal wind vector component"},
    {"name": "10m V Wind", "code": "VGRD", "level": "10_m_above_ground", "unit": "m/s", "description": "Meridional wind vector component"},
    {"name": "Total Precipitation", "code": "APCP", "level": "surface", "unit": "kg/m² (mm)", "description": "Total accumulated precipitation"},
    {"name": "Convective Precipitation", "code": "ACPCP", "level": "surface", "unit": "kg/m² (mm)", "description": "Convective rainfall fraction"},
    {"name": "Total Cloud Cover", "code": "TCDC", "level": "entire_atmosphere", "unit": "%", "description": "Total atmospheric column cloud cover"},
    {"name": "Relative Humidity (850 hPa)", "code": "RH", "level": "850_mb", "unit": "%", "description": "Moisture saturation at 850 hPa"},
    {"name": "Geopotential Height (500 hPa)", "code": "HGT", "level": "500_mb", "unit": "gpm", "description": "Synoptic ridge/trough indicator"},
    {"name": "Vertical Velocity (700 hPa)", "code": "VVEL", "level": "700_mb", "unit": "Pa/s", "description": "Omega upward/downward motion"},
    {"name": "CAPE", "code": "CAPE", "level": "surface", "unit": "J/kg", "description": "Convective Available Potential Energy"},
    {"name": "PWAT", "code": "PWAT", "level": "entire_atmosphere", "unit": "kg/m²", "description": "Precipitable Water in atmospheric column"}
]

def build_gfs_url(
    forecast_date: date | str,
    cycle: str = "00",
    forecast_hour: int = 24,
    variables: Optional[List[str]] = None,
    levels: Optional[List[str]] = None,
    top: float = 38.0,
    bottom: float = 6.0,
    left: float = 68.0,
    right: float = 98.0
) -> str:
    """Constructs real NOAA NOMADS subregion filter URL for the Indian subcontinent."""
    settings = get_settings()
    d_str = forecast_date.strftime("%Y%m%d") if isinstance(forecast_date, date) else str(forecast_date).replace("-", "")
    c_str = str(cycle).replace("Z", "").zfill(2)
    
    params = {
        "subregion": "",
        "leftlon": left,
        "rightlon": right,
        "toplat": top,
        "bottomlat": bottom,
        "dir": f"/gfs.{d_str}/{c_str}/atmos",
        "file": f"gfs.t{c_str}z.pgrb2.0p25.f{forecast_hour:03d}"
    }
    
    # Enable requested meteorological parameters
    vars_to_add = variables or ["TMP", "DPT", "PRES", "PRMSL", "UGRD", "VGRD", "APCP", "RH", "HGT", "CAPE", "PWAT"]
    for v in vars_to_add:
        params[f"var_{v}"] = "on"
        
    levs_to_add = levels or ["2_m_above_ground", "10_m_above_ground", "mean_sea_level", "surface", "850_mb", "500_mb", "700_mb"]
    for lev in levs_to_add:
        params[f"lev_{lev}"] = "on"

    return str(httpx.URL(settings.nomads_base_url, params=params))

class GFSProvider(NWPDataSource):
    def __init__(self):
        self.settings = get_settings()

    async def get_forecast(self, **kwargs) -> Dict[str, Any]:
        url = build_gfs_url(
            kwargs.get("date", date.today()),
            kwargs.get("cycle", "00"),
            kwargs.get("forecast_hour", 24)
        )
        return {
            "model": "NOAA GFS",
            "resolution": "0.25° (~27 km)",
            "url": url,
            "status": "ready" if self.settings.nomads_enabled else "mocked",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    async def get_metadata(self) -> Dict[str, Any]:
        return {
            "model": "NOAA GFS (Global Forecast System)",
            "center": "National Centers for Environmental Prediction (NCEP / NOAA)",
            "grid_resolution": "0.25° x 0.25° (~27 km)",
            "forecast_range": "Day 1 to Day 16 (0 to 384 hours)",
            "update_cycles": ["00Z", "06Z", "12Z", "18Z"],
            "subregion_bounds": {"north": 38.0, "south": 6.0, "west": 68.0, "east": 98.0},
            "status": "OPERATIONAL"
        }

    async def get_variables(self) -> List[Dict[str, Any]]:
        return GFS_VARIABLES

    async def get_status(self) -> Dict[str, Any]:
        return {
            "name": "NOAA GFS",
            "provider": "NCEP / NOAA NOMADS",
            "status": "LIVE CONNECTED" if self.settings.nomads_enabled and self.settings.data_mode == "live" else "READY (DEMO MODE)",
            "freshness": "Latest 00Z Cycle",
            "resolution": "0.25°",
            "enabled": self.settings.nomads_enabled
        }

    async def get_forecast_runs(self) -> List[str]:
        return ["00Z", "06Z", "12Z", "18Z"]
