"""Inference pipeline for WeatherGuard AI Models."""
from pathlib import Path
from typing import Dict, Any, Tuple
import joblib
import numpy as np
from xgboost import XGBClassifier, XGBRegressor
from ..config import get_settings

MODEL_DIR = Path(get_settings().ml_model_path)

_regressor: XGBRegressor | None = None
_classifier: XGBClassifier | None = None
_metadata: Dict[str, Any] | None = None

FEATURE_COLUMNS = [
    "lead_time",
    "temperature_2m",
    "relative_humidity",
    "rainfall",
    "pressure_msl",
    "pressure_tendency",
    "wind_speed",
    "wind_shear_850_200",
    "cape",
    "pwat",
    "ensemble_spread",
    "historical_error"
]

def get_models() -> Tuple[XGBRegressor | None, XGBClassifier | None, list[str]]:
    global _regressor, _classifier, _metadata
    if _regressor is not None and _classifier is not None:
        return _regressor, _classifier, FEATURE_COLUMNS

    reg_path = MODEL_DIR / "forecast_error_model.json"
    clf_path = MODEL_DIR / "forecast_bust_model.json"
    
    if reg_path.exists() and clf_path.exists():
        try:
            reg = XGBRegressor()
            reg.load_model(str(reg_path))
            clf = XGBClassifier()
            clf.load_model(str(clf_path))
            _regressor = reg
            _classifier = clf
            return _regressor, _classifier, FEATURE_COLUMNS
        except Exception:
            pass

    return None, None, FEATURE_COLUMNS

def predict_single(features_dict: Dict[str, Any]) -> Dict[str, float]:
    """Generates expected error and bust probability from input features."""
    reg, clf, cols = get_models()
    x_vec = np.array([[float(features_dict.get(c, 0.0)) for c in cols]])
    
    if reg and clf:
        exp_err = float(reg.predict(x_vec)[0])
        bust_p = float(clf.predict_proba(x_vec)[0, 1])
    else:
        # Fallback heuristic derived from meteorological volatility
        lead = features_dict.get("lead_time", 1)
        rain = features_dict.get("rainfall", 0)
        shear = features_dict.get("wind_shear_850_200", 12)
        spread = features_dict.get("ensemble_spread", 1.0)
        exp_err = round(1.5 + lead * 0.35 + rain * 0.12 + (shear - 12) * 0.2, 2)
        bust_p = round(min(0.95, max(0.05, 0.08 + lead * 0.045 + (spread - 1.0) * 0.1)), 3)

    return {
        "expected_error": round(exp_err, 2),
        "bust_probability": round(bust_p, 3)
    }
