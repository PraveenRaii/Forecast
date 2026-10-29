"""Abstract Base Class for Numerical Weather Prediction (NWP) Data Sources."""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

class NWPDataSource(ABC):
    """Unified interface for weather model forecast providers."""

    @abstractmethod
    async def get_forecast(self, **kwargs) -> Dict[str, Any]:
        """Fetch raw or interpolated forecast data."""
        pass

    @abstractmethod
    async def get_metadata(self) -> Dict[str, Any]:
        """Return provider specifications, grid resolution, and cycle times."""
        pass

    @abstractmethod
    async def get_variables(self) -> List[Dict[str, Any]]:
        """List variables supported by this provider."""
        pass

    @abstractmethod
    async def get_status(self) -> Dict[str, Any]:
        """Return connectivity and freshness health."""
        pass

    @abstractmethod
    async def get_forecast_runs(self) -> List[str]:
        """Return initialized cycle runs (e.g. 00Z, 06Z, 12Z, 18Z)."""
        pass
