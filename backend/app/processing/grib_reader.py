"""GRIB2 data ingestion utility for NWP forecast files."""
from typing import Any, Dict, List
import numpy as np

def read_grib_file(filepath: str, variables: List[str] | None = None) -> List[Dict[str, Any]]:
    """Ingest GRIB2 messages using xarray/cfgrib if available on host, or safe fallback."""
    try:
        import xarray as xr
        ds = xr.open_dataset(filepath, engine="cfgrib")
        df = ds.to_dataframe().reset_index()
        return df.to_dict("records")
    except Exception as exc:
        # Graceful notice if eccodes/cfgrib is not natively installed in the environment
        return [{
            "status": "notice",
            "message": f"GRIB parsing engine requires libeccodes: {str(exc)}",
            "file": filepath
        }]
