from .base import NWPProvider
from ..config import get_settings
class ECMWFProvider(NWPProvider):
    def _check(self):
        if not (get_settings().ecmwf_enabled and get_settings().ecmwf_api_key): raise RuntimeError("ECMWF integration is not configured")
    async def get_forecast(self, **kwargs): self._check(); raise NotImplementedError("Configure an ECMWF delivery client for production access")
    async def get_metadata(self): return {"model": "ECMWF", "configured": bool(get_settings().ecmwf_enabled and get_settings().ecmwf_api_key)}
    async def get_available_variables(self): return []
    async def get_forecast_runs(self): return []
