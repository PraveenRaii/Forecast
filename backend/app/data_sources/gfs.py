from datetime import date
import httpx
from .base import NWPProvider
from ..config import get_settings

SUPPORTED = {"TMP": ["2_m_above_ground", "surface"], "RH": ["2_m_above_ground"], "PRMSL": ["mean_sea_level"], "UGRD": ["10_m_above_ground"], "VGRD": ["10_m_above_ground"], "APCP": ["surface"]}

def build_gfs_url(forecast_date: date | str, cycle: str, forecast_hour: int, variables: list[str] | None = None, levels: list[str] | None = None, top: int = 37, bottom: int = 6, left: int = 68, right: int = 98) -> str:
    settings = get_settings()
    date_string = forecast_date.strftime("%Y%m%d") if isinstance(forecast_date, date) else str(forecast_date).replace("-", "")
    cycle = str(cycle).replace("Z", "").zfill(2)
    if cycle not in {"00", "06", "12", "18"}: raise ValueError("cycle must be 00, 06, 12, or 18")
    if forecast_hour < 0 or forecast_hour > 240 or forecast_hour % 3: raise ValueError("forecast_hour must be 0–240 in 3-hour steps")
    variables = variables or list(SUPPORTED)
    unknown = set(variables) - set(SUPPORTED)
    if unknown: raise ValueError(f"Unsupported GFS variables: {', '.join(sorted(unknown))}")
    params = {f"var_{v}": "on" for v in variables}
    for level in levels or ["2_m_above_ground", "10_m_above_ground", "mean_sea_level", "surface"]: params[f"lev_{level}"] = "on"
    params.update({"subregion": "", "leftlon": left, "rightlon": right, "toplat": top, "bottomlat": bottom, "dir": f"/gfs.{date_string}/{cycle}/atmos", "file": f"gfs.t{cycle}z.pgrb2.0p25.f{forecast_hour:03d}"})
    return str(httpx.URL(settings.nomads_base_url, params=params))

class GFSProvider(NWPProvider):
    async def get_forecast(self, **kwargs):
        url = build_gfs_url(**kwargs)
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(url)
            response.raise_for_status()
        return {"url": url, "content": response.content}
    async def get_metadata(self): return {"model": "GFS 0.25°", "provider": "NOAA NOMADS", "bounds": [68, 6, 98, 37]}
    async def get_available_variables(self): return SUPPORTED
    async def get_forecast_runs(self): return ["00Z", "06Z", "12Z", "18Z"]
