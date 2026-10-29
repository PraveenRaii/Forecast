"""Meteorological data cleaning, unit conversion, and spatial validation."""
import math
from typing import Any, Dict

def kelvin_to_celsius(k: float) -> float:
    return round(k - 273.15, 2) if k > 150 else k

def pa_to_hpa(pa: float) -> float:
    return round(pa / 100.0, 2) if pa > 1500 else pa

def clean_and_normalize(record: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure standard meteorological units across NWP providers."""
    cleaned = dict(record)
    
    # Temperature: Convert Kelvin to Celsius if necessary
    if "temperature_2m" in cleaned and cleaned["temperature_2m"] > 150:
        cleaned["temperature_2m"] = kelvin_to_celsius(cleaned["temperature_2m"])
    if "dewpoint_2m" in cleaned and cleaned["dewpoint_2m"] > 150:
        cleaned["dewpoint_2m"] = kelvin_to_celsius(cleaned["dewpoint_2m"])
        
    # Pressure: Convert Pa to hPa
    if "pressure_msl" in cleaned and cleaned["pressure_msl"] > 1500:
        cleaned["pressure_msl"] = pa_to_hpa(cleaned["pressure_msl"])
    if "pressure_surface" in cleaned and cleaned["pressure_surface"] > 1500:
        cleaned["pressure_surface"] = pa_to_hpa(cleaned["pressure_surface"])

    # Bounding check for Indian subcontinent
    lat = cleaned.get("latitude", 20.0)
    lon = cleaned.get("longitude", 78.0)
    cleaned["within_india_domain"] = (5.0 <= lat <= 39.0) and (67.0 <= lon <= 99.0)
    
    return cleaned
