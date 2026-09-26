from datetime import date, datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from ...database import db
from ...config import get_settings
from ...data_sources.gfs import GFSProvider, build_gfs_url
from ...data_sources.ecmwf import ECMWFProvider
from ...services.alert_service import build_alerts
from ...seed.seed_demo_data import seed_demo_data

router = APIRouter(prefix="/api")

async def points(lead_time: int | None = None, region: str | None = None):
    q = {}
    if lead_time: q["lead_time"] = lead_time
    if region: q["region"] = region
    records = await db.all("confidence_scores", q)
    # The demo archive stores several historical initialization dates. The
    # operational views should show the latest run once per region.
    latest: dict[str, dict] = {}
    for record in records:
        key = record.get("region", record.get("id"))
        if key not in latest or record.get("valid_time", "") > latest[key].get("valid_time", ""):
            latest[key] = record
    return list(latest.values())

@router.get("/health")
async def health():
    return {"status": "ok", "service": "Safar API", "mode": get_settings().data_mode, "timestamp": datetime.now(timezone.utc).isoformat()}

@router.get("/dashboard/summary")
async def summary(lead_time: int = Query(1, ge=1, le=10)):
    data = await points(lead_time)
    if not data: return {"message": "No data available", "metrics": []}
    high = [p for p in data if p["risk"] in {"HIGH", "VERY_HIGH"}]
    return {"mode": get_settings().data_mode.upper(), "lead_time": lead_time, "model": "GFS 0.25°", "updated_at": datetime.now(timezone.utc).isoformat(), "overall_confidence": round(sum(p["confidence"] for p in data) / len(data)), "high_risk_regions": len(high), "bust_probability": round(sum(p["bust_probability"] for p in data) / len(data), 3), "data_freshness": "Current demo run", "alerts": build_alerts(data), "risk_distribution": {k: sum(p["risk"] == k for p in data) for k in ["VERY_LOW", "LOW", "MODERATE", "HIGH", "VERY_HIGH"]}}

@router.get("/confidence-map")
async def confidence_map(lead_time: int = Query(1, ge=1, le=10)): return {"lead_time": lead_time, "points": await points(lead_time)}

@router.get("/forecast")
async def forecast(region: str | None = None, lead_time: int = Query(1, ge=1, le=10)): return {"data": await points(lead_time, region)}

@router.get("/confidence")
async def confidence(region: str | None = None, lead_time: int = Query(1, ge=1, le=10)): return {"data": await points(lead_time, region)}

@router.get("/bust-probability")
async def bust_probability(lead_time: int = Query(1, ge=1, le=10)): return {"data": await points(lead_time)}

@router.get("/regions")
async def regions(): return {"data": await db.all("regions")}

@router.get("/regions/{region_id}")
async def region_detail(region_id: str):
    region = next((r for r in await db.all("regions") if r["id"] == region_id), None)
    if not region: raise HTTPException(404, "Region not found")
    history = [p for p in await db.all("confidence_scores") if p["region"] == region["name"]]
    return {"region": region, "forecast": [p for p in history if p["id"].endswith("-0")], "history": history}

@router.get("/errors/history")
async def error_history(region: str | None = None, lead_time: int | None = Query(None, ge=1, le=10)):
    data = await db.all("forecast_errors")
    if region: data = [d for d in data if d["region"] == region]
    if lead_time: data = [d for d in data if d["lead_time"] == lead_time]
    return {"data": data}

@router.get("/explanation/{region_id}/{lead_time}")
async def explanation(region_id: str, lead_time: int):
    detail = await region_detail(region_id)
    target = next((p for p in detail["forecast"] if p["lead_time"] == lead_time), None)
    if not target: raise HTTPException(404, "Forecast unavailable")
    contributors = [("Historical error", target["historical_error"] / 10, "increase"), ("Lead time", lead_time / 12, "increase"), ("Humidity", target["relative_humidity"] / 130, "increase"), ("Pressure change", max(0, 1012-target["pressure_msl"])/15, "increase"), ("Wind speed", target["wind_speed"] / 30, "increase")]
    return {"region": target["region"], "lead_time": lead_time, "confidence": target["confidence"], "note": "These are model contributors in demo mode, not validated causal meteorological explanations.", "top_features": [{"feature": n, "impact": round(i, 2), "direction": d} for n, i, d in sorted(contributors, key=lambda x: x[1], reverse=True)]}

@router.get("/model/performance")
async def performance(): return {"data": await db.all("model_metrics")}

@router.get("/nwp/variables")
async def nwp_variables(): return await GFSProvider().get_available_variables()

@router.get("/nwp/metadata")
async def nwp_metadata(): return await GFSProvider().get_metadata()

@router.get("/nwp/status")
async def nwp_status():
    s = get_settings()
    return {"providers": [{"name": "NOAA GFS", "status": "DEMO" if s.data_mode == "demo" else "READY", "enabled": s.nomads_enabled}, {"name": "ECMWF", "status": "READY" if s.ecmwf_enabled and s.ecmwf_api_key else "DISCONNECTED", "enabled": s.ecmwf_enabled}, {"name": "MongoDB", "status": "CONNECTED" if db.connected else "DEMO MEMORY", "enabled": db.connected}, {"name": "ML Model", "status": "DEMO BASELINE", "enabled": True}]}

@router.get("/data/status")
async def data_status(): return {"mode": get_settings().data_mode, "points": len(await db.all("confidence_scores")), "mongo_connected": db.connected}

@router.post("/nwp/ingest")
async def ingest(model: str = "GFS", date_value: date = date.today(), cycle: str = "00", lead_time: int = Query(1, ge=0, le=10)):
    if model.upper() != "GFS": raise HTTPException(400, "Only GFS ingestion is available in this prototype")
    if get_settings().data_mode == "demo":
        result = await seed_demo_data()
        return {"success": True, "model": "GFS", "records_inserted": result["points"], "run_time": "demo", "lead_time": lead_time, "message": "Demo data refreshed; set DATA_MODE=live to fetch NOMADS."}
    try:
        url = build_gfs_url(date_value, cycle, lead_time * 24 if lead_time else 0)
        return {"success": False, "model": "GFS", "url": url, "message": "Live GRIB parsing requires cfgrib/eccodes installed on the host."}
    except ValueError as exc: raise HTTPException(422, str(exc))
