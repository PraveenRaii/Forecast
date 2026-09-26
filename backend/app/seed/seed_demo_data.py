"""Generate correlated, deterministic demo weather across India."""
import asyncio
from datetime import datetime, timedelta, timezone
import math
import random
from ..database import db
from ..services.confidence_engine import calculate_confidence
from ..services.alert_service import build_alerts

REGIONS = [
    ("Delhi NCR", 28.61, 77.21), ("Uttar Pradesh", 26.85, 80.95), ("Rajasthan", 26.91, 75.79), ("Punjab", 30.90, 75.86),
    ("Gujarat", 22.26, 71.19), ("Maharashtra", 19.75, 75.71), ("Madhya Pradesh", 23.47, 77.95), ("Bihar", 25.10, 85.31),
    ("West Bengal", 22.99, 87.86), ("Odisha", 20.95, 85.10), ("Karnataka", 15.32, 75.71), ("Tamil Nadu", 11.13, 78.66),
    ("Kerala", 10.85, 76.27), ("Telangana", 17.85, 79.11), ("Andhra Pradesh", 15.91, 79.74), ("Assam", 26.20, 92.94),
    ("Meghalaya", 25.47, 91.37), ("Jammu & Kashmir", 33.78, 76.58), ("Himachal Pradesh", 31.10, 77.17), ("Uttarakhand", 30.07, 79.02),
    ("Chhattisgarh", 21.28, 81.87), ("Jharkhand", 23.61, 85.28), ("Goa", 15.30, 74.12), ("Sikkim", 27.53, 88.51),
    ("Arunachal Pradesh", 28.22, 94.73), ("Manipur", 24.66, 93.91), ("Mizoram", 23.16, 92.94), ("Nagaland", 26.16, 94.56),
    ("Tripura", 23.94, 91.99), ("Ladakh", 34.15, 77.58), ("Haryana", 29.06, 76.09), ("Bengaluru", 12.97, 77.59),
    ("Mumbai", 19.08, 72.88), ("Chennai", 13.08, 80.27), ("Kolkata", 22.57, 88.36), ("Hyderabad", 17.39, 78.49),
    ("Pune", 18.52, 73.86), ("Lucknow", 26.85, 80.95), ("Jaipur", 26.91, 75.79), ("Patna", 25.59, 85.14),
    ("Bhopal", 23.26, 77.41), ("Ahmedabad", 23.02, 72.57), ("Kochi", 9.93, 76.27), ("Srinagar", 34.08, 74.79),
    ("Guwahati", 26.14, 91.74), ("Visakhapatnam", 17.69, 83.22), ("Bhubaneswar", 20.30, 85.82), ("Nagpur", 21.15, 79.09),
    ("Thiruvananthapuram", 8.52, 76.94), ("Shimla", 31.10, 77.17), ("Dehradun", 30.32, 78.03),
]

def point(region, lat, lon, lead, day_offset=0):
    seed = f"{region}:{lead}:{day_offset}"
    rng = random.Random(seed)
    coastal = max(0, 1 - abs(lon - 78) / 16)
    monsoon = 0.55 + 0.35 * math.sin((lon + lat + day_offset * 3) / 9)
    disturbance = max(0, math.sin((lat * 2 + lon + lead * 9 + day_offset) / 12))
    temp = 30 - (lat - 20) * .35 + 2 * math.sin(lon / 7) + rng.uniform(-1.2, 1.2)
    humidity = min(96, max(32, 55 + 30 * monsoon + 8 * coastal + rng.uniform(-5, 5)))
    rain = max(0, (humidity - 58) * .8 * monsoon + disturbance * 17 + rng.uniform(-3, 3))
    pressure = 1008 - disturbance * 10 - rain * .14 + rng.uniform(-2, 2)
    wind = 4 + disturbance * 14 + coastal * 4 + rng.uniform(-1, 2)
    expected_error = 1.3 + lead * .22 + disturbance * 4 + rain * .08
    historic = 3.8 + rain * .05 + coastal
    bust = min(.96, max(.03, .06 + lead * .025 + disturbance * .44 + rain * .009 + rng.uniform(-.06, .06)))
    confidence = calculate_confidence(bust, expected_error, historic, lead, disturbance * 8)
    valid = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) + timedelta(days=lead + day_offset)
    return {"id": f"{region.lower().replace(' ', '-')}-{lead}-{day_offset}", "region": region, "latitude": lat, "longitude": lon, "lead_time": lead, "model": "GFS", "forecast_run": "demo", "run_time": valid.isoformat(), "valid_time": valid.isoformat(), "timestamp": valid.isoformat(), "temperature_2m": round(temp, 1), "relative_humidity": round(humidity, 1), "rainfall": round(rain, 1), "pressure_msl": round(pressure, 1), "wind_speed": round(wind, 1), "wind_u_10m": round(wind * .7, 1), "wind_v_10m": round(wind * .4, 1), "expected_error": round(expected_error, 2), "historical_error": round(historic, 2), "bust_probability": round(bust, 3), "confidence": confidence.score, "risk": confidence.risk, "reference_temperature": round(temp + rng.uniform(-expected_error, expected_error), 1)}

async def seed_demo_data(force=False):
    existing = await db.all("confidence_scores", limit=1)
    if existing and not force: return {"seeded": False, "points": len(await db.all("confidence_scores"))}
    records = [point(*region, lead, past) for past in range(-6, 1) for lead in range(1, 11) for region in REGIONS]
    await db.upsert_many("confidence_scores", records, ["id"])
    await db.upsert_many("forecasts", records, ["id"])
    errors = [{"id": r["id"], "region": r["region"], "lead_time": r["lead_time"], "model": "GFS", "timestamp": r["timestamp"], "temperature_error": abs(r["temperature_2m"] - r["reference_temperature"]), "rainfall_error": round(r["expected_error"] * 1.5, 2), "wind_error": round(r["expected_error"] * .8, 2), "mae": r["expected_error"], "rmse": round(r["expected_error"] * 1.25, 2), "bias": round(r["temperature_2m"] - r["reference_temperature"], 2)} for r in records]
    await db.upsert_many("forecast_errors", errors, ["id"])
    current = [r for r in records if r["lead_time"] == 1 and r["id"].endswith("-0")]
    await db.upsert_many("alerts", build_alerts(current), ["message"])
    await db.upsert_many("regions", [{"id": name.lower().replace(" ", "-"), "name": name, "latitude": lat, "longitude": lon} for name, lat, lon in REGIONS], ["id"])
    metrics = [{"name": "Forecast error regression", "version": "demo-baseline-1.0", "training_samples": len(records), "features": 12, "trained_at": datetime.now(timezone.utc).isoformat(), "mae": 2.84, "rmse": 3.71, "r2": .68}, {"name": "Forecast bust classification", "version": "demo-baseline-1.0", "training_samples": len(records), "features": 12, "trained_at": datetime.now(timezone.utc).isoformat(), "precision": .74, "recall": .71, "f1": .72, "roc_auc": .81, "pr_auc": .76, "brier_score": .14}]
    await db.upsert_many("model_metrics", metrics, ["name"])
    return {"seeded": True, "points": len(records)}

if __name__ == "__main__":
    asyncio.run(db.connect()); print(asyncio.run(seed_demo_data(force=True)))
