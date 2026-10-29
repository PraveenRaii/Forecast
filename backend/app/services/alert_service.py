"""Operational WeatherGuard Alert Engine.

Scans operational forecasts across lead times and subdivisions to surface
meteorological reliability warnings, bust alarms, and model uncertainty surges.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List

def build_alerts(points: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Synthesizes high-priority alerts from current forecast confidence states."""
    alerts = []
    
    # 1. Critical Forecast Bust Alarms (Bust Probability > 65%)
    bust_risks = [p for p in points if p.get("bust_probability", 0) >= 0.65]
    for p in sorted(bust_risks, key=lambda x: x.get("bust_probability", 0), reverse=True)[:3]:
        alerts.append({
            "id": f"bust-{p.get('region_id', 'reg')}-{p.get('lead_time', 1)}",
            "type": "CRITICAL_BUST_RISK",
            "level": "CRITICAL",
            "region": p.get("region"),
            "lead_time": p.get("lead_time"),
            "message": f"Elevated forecast-bust probability ({int(p.get('bust_probability', 0)*100)}%) detected over {p.get('region')} at Day {p.get('lead_time')}.",
            "details": f"Synoptic regime: {p.get('synoptic_regime', 'Rapid synoptic evolution')}. Expected rainfall error: ±{p.get('expected_error', 0)} mm.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    # 2. Very Low Confidence Areas (Confidence < 35%)
    low_conf = [p for p in points if p.get("confidence", 100) < 35 and p not in bust_risks]
    for p in sorted(low_conf, key=lambda x: x.get("confidence", 100))[:2]:
        alerts.append({
            "id": f"conf-{p.get('region_id', 'reg')}-{p.get('lead_time', 1)}",
            "type": "LOW_CONFIDENCE_WARNING",
            "level": "WARNING",
            "region": p.get("region"),
            "lead_time": p.get("lead_time"),
            "message": f"Forecast confidence dropped to {p.get('confidence')}% over {p.get('region')} (Day {p.get('lead_time')}).",
            "details": f"Driven by strong vertical wind shear ({p.get('wind_shear_850_200', 0)} m/s) and rapid barometric tendency ({p.get('pressure_tendency', 0)} hPa/3h).",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    # 3. Ensemble Spread Divergence Alert (Spread > 3.0)
    high_spread = [p for p in points if p.get("ensemble_spread", 0) >= 2.8]
    if high_spread:
        top_s = max(high_spread, key=lambda x: x.get("ensemble_spread", 0))
        alerts.append({
            "id": f"spread-{top_s.get('region_id', 'reg')}",
            "type": "ENSEMBLE_DIVERGENCE",
            "level": "ADVISORY",
            "region": top_s.get("region"),
            "lead_time": top_s.get("lead_time"),
            "message": f"Significant ensemble spread divergence over {top_s.get('region')}: model trajectory bifurcation likely.",
            "details": f"GEFS 31-member perturbation spread is {top_s.get('ensemble_spread')} σ, signaling high sensitivity to initial conditions.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    return alerts
