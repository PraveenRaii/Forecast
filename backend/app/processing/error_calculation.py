"""Forecast verification error calculation service."""
from typing import Dict
import numpy as np

def calculate_single_error(forecast_val: float, reference_val: float) -> Dict[str, float]:
    """Computes absolute error, bias, and fractional relative error."""
    abs_err = abs(forecast_val - reference_val)
    bias = forecast_val - reference_val
    rel_err = abs_err / max(abs(reference_val), 0.1)
    return {
        "absolute_error": round(abs_err, 2),
        "bias": round(bias, 2),
        "relative_error": round(rel_err, 3)
    }

def calculate_aggregate_metrics(actual_list: list, predicted_list: list) -> Dict[str, float]:
    """Calculates bulk verification metrics: MAE, RMSE, Bias, 90th and 95th percentiles."""
    if not actual_list or not predicted_list:
        return {"mae": 0.0, "rmse": 0.0, "bias": 0.0, "p90": 0.0, "p95": 0.0}
    
    act = np.array(actual_list)
    pred = np.array(predicted_list)
    diff = pred - act
    abs_diff = np.abs(diff)
    
    return {
        "mae": round(float(np.mean(abs_diff)), 2),
        "rmse": round(float(np.sqrt(np.mean(diff ** 2))), 2),
        "bias": round(float(np.mean(diff)), 2),
        "p90": round(float(np.percentile(abs_diff, 90)), 2),
        "p95": round(float(np.percentile(abs_diff, 95)), 2)
    }
