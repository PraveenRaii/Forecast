"""Feature engineering for NWP Forecast Reliability and Bust Detection."""
import math
from typing import Any, Dict

def enrich_features(data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate derived meteorological and synoptic instability features."""
    enriched = dict(data)
    
    # 1. Wind speed and direction from orthogonal U & V components
    u = enriched.get("wind_u_10m", 0.0)
    v = enriched.get("wind_v_10m", 0.0)
    if "wind_speed" not in enriched:
        enriched["wind_speed"] = round(math.hypot(u, v), 2)
    if "wind_direction" not in enriched:
        deg = (math.degrees(math.atan2(-u, -v)) + 360.0) % 360.0
        enriched["wind_direction"] = round(deg, 1)

    # 2. Moisture Indicators
    t = enriched.get("temperature_2m", 30.0)
    td = enriched.get("dewpoint_2m", t - 5.0)
    enriched["dewpoint_depression"] = round(max(0.0, t - td), 2)

    # 3. Pressure tendencies and synoptic gradients
    mslp = enriched.get("pressure_msl", 1010.0)
    enriched["pressure_anomaly"] = round(mslp - 1013.25, 2)

    # 4. Lead-time decay penalty
    lead = enriched.get("lead_time", 1)
    enriched["lead_decay_factor"] = round(math.exp(0.12 * (lead - 1)), 3)

    return enriched
