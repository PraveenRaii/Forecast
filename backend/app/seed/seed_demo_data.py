"""Deterministic, Meteorologically Coherent Data Generator for WeatherGuard AI.

Populates the database with:
- 48+ Synoptic Regions / Subdivisions across India
- Day 1 to Day 10 Lead Times
- Multi-day historical run history for verification benchmarks
- Observations and Ground Truth (ERA5 / IMD proxy)
- Pre-computed errors and Bust labels
- Provider statuses and ML model metrics
"""
import asyncio
from datetime import datetime, timezone
from ..database import db
from ..data_sources.mock_weather import INDIAN_REGIONS, generate_synoptic_point
from ..services.alert_service import build_alerts

async def seed_demo_data(force: bool = False):
    existing = await db.all("confidence_scores", limit=1)
    if existing and not force:
        return {"seeded": False, "points": len(await db.all("confidence_scores"))}

    # Generate 10-day forecasts across current run (offset 0) and past 6 historical verification cycles (-6 to 0)
    all_points = []
    for past_day in range(-6, 1):
        for lead in range(1, 11):
            for reg in INDIAN_REGIONS:
                all_points.append(generate_synoptic_point(reg, lead, past_day))

    # 1. Upsert confidence scores and forecasts
    await db.upsert_many("confidence_scores", all_points, ["id"])
    await db.upsert_many("forecasts", all_points, ["id"])

    # 2. Extract error tracking records
    errors = []
    for p in all_points:
        errors.append({
            "id": f"err-{p['id']}",
            "region_id": p["region_id"],
            "region": p["region"],
            "lead_time": p["lead_time"],
            "model": p["model"],
            "timestamp": p["timestamp"],
            "temperature_error": p["temperature_error"],
            "rainfall_error": p["rainfall_error"],
            "wind_error": p["wind_error"],
            "mae": p["expected_error"],
            "rmse": round(p["expected_error"] * 1.28, 2),
            "bias": round(p["temperature_2m"] - p["reference_temperature"], 2),
            "is_bust": p["is_bust"],
            "historical_error": p["historical_error"]
        })
    await db.upsert_many("forecast_errors", errors, ["id"])

    # 3. Upsert regions catalog
    regions_list = [
        {
            "id": r["id"],
            "name": r["name"],
            "state": r["state"],
            "zone": r["zone"],
            "latitude": r["lat"],
            "longitude": r["lon"],
            "climate": r["climate"],
            "synoptic_regime": r["regime"]
        }
        for r in INDIAN_REGIONS
    ]
    await db.upsert_many("regions", regions_list, ["id"])

    # 4. Generate operational alerts from current run
    current_run_points = [p for p in all_points if p["id"].endswith("-off0")]
    alerts = build_alerts(current_run_points)
    await db.upsert_many("alerts", alerts, ["id"])

    # 5. Populate Data Sources catalog
    sources = [
        {
            "id": "src-gfs",
            "name": "NOAA GFS 0.25°",
            "provider": "NCEP / NOAA NOMADS",
            "type": "Global Deterministic NWP",
            "resolution": "0.25° (~27 km)",
            "cycles": "00Z, 06Z, 12Z, 18Z",
            "status": "LIVE READY",
            "lead_time_max": "Day 16"
        },
        {
            "id": "src-ecmwf",
            "name": "ECMWF IFS & AIFS",
            "provider": "European Centre for Medium-Range Weather Forecasts",
            "type": "High-Resolution / Machine Learning NWP",
            "resolution": "0.1° (~9 km)",
            "cycles": "00Z, 12Z",
            "status": "CONFIGURABLE (CDS/MARS API)",
            "lead_time_max": "Day 10"
        },
        {
            "id": "src-era5",
            "name": "ERA5 Reanalysis",
            "provider": "Copernicus Climate Data Store (C3S)",
            "type": "Verification Ground Truth",
            "resolution": "0.25° (~31 km)",
            "cycles": "Hourly Historical Reanalysis",
            "status": "OPERATIONAL BENCHMARK",
            "lead_time_max": "N/A"
        },
        {
            "id": "src-gefs",
            "name": "NOAA GEFS (31 Members)",
            "provider": "NCEP / NOAA",
            "type": "Global Ensemble Prediction System",
            "resolution": "0.50° (~50 km)",
            "cycles": "00Z, 06Z, 12Z, 18Z",
            "status": "LIVE ENSEMBLE SPREAD",
            "lead_time_max": "Day 16"
        }
    ]
    await db.upsert_many("data_sources", sources, ["id"])

    # 6. Baseline model performance metrics
    metrics = [
        {
            "id": "metric-reg-1",
            "name": "Forecast Error Regression (Model A)",
            "model_type": "XGBoost Regressor",
            "target": "Expected Forecast Error (mm / °C)",
            "version": "v2.4-operational",
            "training_samples": len(all_points),
            "features_count": 14,
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "mae": 2.41,
            "rmse": 3.19,
            "r2": 0.76
        },
        {
            "id": "metric-clf-1",
            "name": "Forecast Bust Classification (Model B)",
            "model_type": "XGBoost Classifier",
            "target": "Forecast Bust Probability (P >= 90th percentile error)",
            "version": "v2.4-operational",
            "training_samples": len(all_points),
            "features_count": 14,
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "precision": 0.82,
            "recall": 0.79,
            "f1": 0.80,
            "roc_auc": 0.87,
            "pr_auc": 0.81,
            "brier_score": 0.11
        }
    ]
    await db.upsert_many("model_metrics", metrics, ["id"])

    return {"seeded": True, "points": len(all_points), "regions": len(INDIAN_REGIONS)}

if __name__ == "__main__":
    asyncio.run(db.connect())
    print(asyncio.run(seed_demo_data(force=True)))
