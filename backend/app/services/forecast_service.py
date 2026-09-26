from ..data_sources.gfs import GFSProvider
from ..data_sources.mock_weather import MockNWPProvider
from ..config import get_settings
def selected_provider():
    return MockNWPProvider() if get_settings().data_mode == "demo" else GFSProvider()
