"""Test all WeatherGuard AI FastAPI endpoints."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    print("Testing WeatherGuard AI API Endpoints...", flush=True)
    client = TestClient(app)
    
    # 1. Health
    r = client.get("/api/health")
    print("1. GET /api/health ->", r.status_code, r.json()["service"], flush=True)
    assert r.status_code == 200

    # 2. Dashboard Summary
    r = client.get("/api/dashboard/summary?lead_time=1")
    print("2. GET /api/dashboard/summary ->", r.status_code, "Overall Conf:", r.json()["overall_confidence"], flush=True)
    assert r.status_code == 200

    # 3. Confidence Map
    r = client.get("/api/confidence-map?lead_time=3")
    pts = r.json()["points"]
    print("3. GET /api/confidence-map (Day 3) ->", r.status_code, f"Returned {len(pts)} points", flush=True)
    assert r.status_code == 200 and len(pts) > 0

    # 4. Regions
    r = client.get("/api/regions")
    regs = r.json()["data"]
    print("4. GET /api/regions ->", r.status_code, f"{len(regs)} regions registered", flush=True)
    assert r.status_code == 200 and len(regs) > 0

    # 5. Region Detail
    reg_id = regs[0]["id"]
    r = client.get(f"/api/regions/{reg_id}")
    print(f"5. GET /api/regions/{reg_id} ->", r.status_code, "10-day forecasts:", len(r.json()["forecast_10day"]), flush=True)
    assert r.status_code == 200

    # 6. Explainable AI (SHAP factors)
    r = client.get(f"/api/explanation/{reg_id}/3")
    factors = r.json()["top_factors"]
    print(f"6. GET /api/explanation/{reg_id}/Day 3 ->", r.status_code, f"{len(factors)} SHAP contributing factors", flush=True)
    print("   Top Factor:", factors[0]["label"], "| Impact:", factors[0]["impact"], flush=True)
    assert r.status_code == 200 and len(factors) > 0

    # 7. Historical Errors
    r = client.get("/api/errors/history")
    summary = r.json()["summary"]
    print("7. GET /api/errors/history ->", r.status_code, "MAE:", summary["mae"], "RMSE:", summary["rmse"], flush=True)
    assert r.status_code == 200

    # 8. Model Performance
    r = client.get("/api/model/performance")
    metrics = r.json()["metrics"]
    print("8. GET /api/model/performance ->", r.status_code, f"{len(metrics)} model metric profiles", flush=True)
    assert r.status_code == 200

    # 9. NWP Variables & Status
    r = client.get("/api/nwp/status")
    providers = r.json()["providers"]
    print("9. GET /api/nwp/status ->", r.status_code, f"{len(providers)} NWP providers monitored", flush=True)
    assert r.status_code == 200

    # 10. Global Search
    r = client.get("/api/search?q=mumbai")
    res = r.json()["results"]
    print("10. GET /api/search?q=mumbai ->", r.status_code, f"Matches: {[m['name'] for m in res]}", flush=True)
    assert r.status_code == 200 and len(res) > 0

    # 11. Alerts
    r = client.get("/api/alerts")
    alerts = r.json()["alerts"]
    print("11. GET /api/alerts ->", r.status_code, f"{len(alerts)} active meteorological alerts", flush=True)
    assert r.status_code == 200

    print("\nALL WEATHERGUARD AI API ENDPOINTS VALIDATED & PASSING 100%!", flush=True)

if __name__ == "__main__":
    run_tests()
