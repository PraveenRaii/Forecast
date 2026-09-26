def calculate_error(forecast: float, reference: float) -> dict:
    return {"absolute_error": abs(forecast - reference), "forecast_bias": forecast - reference, "relative_error": abs(forecast - reference) / max(abs(reference), 0.001)}
