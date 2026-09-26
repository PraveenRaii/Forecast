import math
def enrich_weather_features(values: dict) -> dict:
    u, v = values.get("wind_u_10m", 0), values.get("wind_v_10m", 0)
    return {**values, "wind_speed": round(math.hypot(u, v), 2), "wind_direction": round((math.degrees(math.atan2(u, v)) + 360) % 360, 1)}
