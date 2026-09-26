def is_forecast_bust(current_error: float, historical_percentile_error: float) -> bool:
    return current_error >= historical_percentile_error
