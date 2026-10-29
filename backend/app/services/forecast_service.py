"""Service for dispatching requests to active NWP data providers."""
from typing import Dict, Any
from ..data_sources.base import NWPDataSource
from ..data_sources.gfs import GFSProvider
from ..data_sources.ecmwf import ECMWFProvider
from ..data_sources.gefs import GEFSProvider
from ..data_sources.mock_weather import MockNWPProvider
from ..config import get_settings

PROVIDERS: Dict[str, NWPDataSource] = {
    "GFS": GFSProvider(),
    "ECMWF": ECMWFProvider(),
    "GEFS": GEFSProvider(),
    "DEMO": MockNWPProvider()
}

def get_nwp_provider(model_name: str | None = None) -> NWPDataSource:
    settings = get_settings()
    if settings.data_mode == "demo":
        return PROVIDERS["DEMO"]
    
    key = (model_name or settings.default_nwp_model).upper()
    return PROVIDERS.get(key, PROVIDERS["GFS"])
