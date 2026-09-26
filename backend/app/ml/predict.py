from pathlib import Path
from xgboost import XGBClassifier, XGBRegressor
from ..config import get_settings

def load_models():
    path = Path(get_settings().ml_model_path)
    regression, classification = XGBRegressor(), XGBClassifier()
    regression.load_model(path / "forecast_error_model.json")
    classification.load_model(path / "forecast_bust_model.json")
    return regression, classification
