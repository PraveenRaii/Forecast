def build_alerts(points: list[dict]) -> list[dict]:
    high = [p for p in points if p["risk"] in {"HIGH", "VERY_HIGH"}]
    if not high:
        return [{"severity": "info", "message": "Forecast confidence is stable across monitored regions.", "region": "India"}]
    by_region = sorted(high, key=lambda p: p["bust_probability"], reverse=True)[:3]
    return [{"severity": "high" if p["risk"] == "VERY_HIGH" else "medium", "region": p["region"], "message": f"Elevated forecast uncertainty over {p['region']} for Day {p['lead_time']}; bust probability is {round(p['bust_probability'] * 100)}%."} for p in by_region]
