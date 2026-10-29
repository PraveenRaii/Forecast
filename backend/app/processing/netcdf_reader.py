"""NetCDF4 and Copernicus CDS data reader using xarray."""
from typing import Any, Dict, List

def read_netcdf_file(filepath: str) -> List[Dict[str, Any]]:
    """Ingest NetCDF4 (.nc) files from ERA5 or Copernicus reanalysis."""
    try:
        import xarray as xr
        with xr.open_dataset(filepath) as ds:
            return ds.to_dataframe().reset_index().to_dict("records")
    except Exception as exc:
        return [{
            "status": "notice",
            "message": f"NetCDF ingestion notice: {str(exc)}",
            "file": filepath
        }]
