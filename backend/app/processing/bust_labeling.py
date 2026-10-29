"""Forecast Bust Labeling Engine with Configurable Thresholds.

Scientific Note:
In operational meteorological verification, a 'forecast bust' represents a catastrophic
or decision-invalidating error where the operational forecast departs severely from observed reality.
By default, an error exceeding the historical 90th percentile (or custom configurable percentile)
is categorized as a bust event. Final operational threshold tuning requires validation against
user impact tolerances (e.g., flood warning triggers vs aviation wind limits).
"""
from typing import Dict, Any
from ..config import get_settings

def evaluate_forecast_bust(
    current_error: float,
    historical_percentile_error: float,
    percentile_threshold: int | None = None
) -> Dict[str, Any]:
    """
    Evaluates whether an error constitutes a forecast bust.
    The threshold is dynamically configurable and not hardcoded into ML weights.
    """
    threshold_used = percentile_threshold or get_settings().bust_percentile
    is_bust = bool(current_error >= historical_percentile_error)
    
    # Severity assessment
    severity = "NONE"
    if is_bust:
        ratio = current_error / max(historical_percentile_error, 0.1)
        if ratio >= 1.5:
            severity = "EXTREME_BUST"
        elif ratio >= 1.2:
            severity = "SEVERE_BUST"
        else:
            severity = "MODERATE_BUST"

    return {
        "is_bust": is_bust,
        "severity": severity,
        "percentile_threshold": threshold_used,
        "current_error": round(current_error, 2),
        "threshold_error": round(historical_percentile_error, 2)
    }
