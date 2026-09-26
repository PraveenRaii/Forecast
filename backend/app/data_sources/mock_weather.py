from ..seed.seed_demo_data import point
from .base import NWPProvider
class MockNWPProvider(NWPProvider):
    async def get_forecast(self, **kwargs):
        return point(kwargs.get("region", "Demo Region"), kwargs.get("latitude", 20), kwargs.get("longitude", 78), kwargs.get("lead_time", 1))
    async def get_metadata(self): return {"model": "Safar demo", "synthetic": True}
    async def get_available_variables(self): return ["temperature_2m", "relative_humidity", "pressure_msl", "rainfall", "wind_speed"]
    async def get_forecast_runs(self): return ["demo"]
