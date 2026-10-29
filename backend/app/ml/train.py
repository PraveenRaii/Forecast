"""Production-Style ML Training Pipeline for WeatherGuard AI.

Trains:
- Model A: XGBoost Regressor for Expected Forecast Error (mm / °C)
- Model B: XGBoost Classifier for Forecast Bust Probability (0 to 1)

Saves models, features schema, and evaluation metrics into `ml_models/` and database.
Can be executed via CLI: `python -m app.ml.train`
"""
import asyncio
from datetime import datetime, timezone
import json
from pathlib import Path
import numpy as np
from xgboost import XGBClassifier, XGBRegressor
from ..database import db
from ..config import get_settings
from .evaluate import evaluate_regression, evaluate_classification
from .predict import FEATURE_COLUMNS

async def train_models():
    print("Initializing Database connection...", flush=True)
    await db.connect()
    
    # 1. Fetch training data from seeded / ingested forecasts
    records = await db.all("confidence_scores", limit=5000)
    if len(records) < 50:
        print("Seeding baseline meteorological dataset...", flush=True)
        from ..seed.seed_demo_data import seed_demo_data
        await seed_demo_data(force=True)
        records = await db.all("confidence_scores", limit=5000)

    print(f"Loaded {len(records)} meteorological records for training.", flush=True)

    # Sort chronologically by valid_time for time-series walk-forward split
    records = sorted(records, key=lambda r: r.get("valid_time", ""))
    
    # Feature matrix X
    X = np.array([[float(r.get(c, 0.0)) for c in FEATURE_COLUMNS] for r in records])
    
    # Targets:
    # y_error: Expected absolute error (Regression)
    y_error = np.array([float(r.get("expected_error", r.get("rainfall_error", 2.0))) for r in records])
    
    # y_bust: Binary bust label (Classification: 1 if error >= 90th percentile)
    threshold = get_settings().bust_percentile
    y_bust = np.array([int(r.get("is_bust", int(r.get("bust_probability", 0) >= 0.5))) for r in records])
    
    # 80/20 train/test split
    split_idx = int(len(records) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_err_train, y_err_test = y_error[:split_idx], y_error[split_idx:]
    y_bust_train, y_bust_test = y_bust[:split_idx], y_bust[split_idx:]

    print("Fitting Model A (XGBoost Regressor for Expected Error)...", flush=True)
    reg = XGBRegressor(
        n_estimators=40,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42
    )
    reg.fit(X_train, y_err_train)
    pred_err = reg.predict(X_test)
    reg_metrics = evaluate_regression(y_err_test, pred_err)

    print("Fitting Model B (XGBoost Classifier for Bust Probability)...", flush=True)
    clf = XGBClassifier(
        n_estimators=40,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        eval_metric="logloss",
        random_state=42
    )
    clf.fit(X_train, y_bust_train)
    proba_bust = clf.predict_proba(X_test)[:, 1]
    clf_metrics = evaluate_classification(y_bust_test, proba_bust)

    # 4. Save models to disk
    model_dir = Path(get_settings().ml_model_path)
    model_dir.mkdir(parents=True, exist_ok=True)
    
    reg.save_model(str(model_dir / "forecast_error_model.json"))
    clf.save_model(str(model_dir / "forecast_bust_model.json"))
    
    metadata = {
        "features": FEATURE_COLUMNS,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "regression_metrics": reg_metrics,
        "classification_metrics": clf_metrics,
        "bust_threshold_percentile": threshold
    }
    with open(model_dir / "model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    # 5. Persist metrics to database for dashboard display
    db_metrics = [
        {
            "id": "metric-reg-1",
            "name": "Forecast Error Regression (Model A)",
            "model_type": "XGBoost Regressor",
            "target": "Expected Forecast Error (mm / °C)",
            "version": "v2.4-trained",
            "training_samples": len(records),
            "features_count": len(FEATURE_COLUMNS),
            "trained_at": datetime.now(timezone.utc).isoformat(),
            **reg_metrics
        },
        {
            "id": "metric-clf-1",
            "name": "Forecast Bust Classification (Model B)",
            "model_type": "XGBoost Classifier",
            "target": "Forecast Bust Probability (P >= 90th percentile)",
            "version": "v2.4-trained",
            "training_samples": len(records),
            "features_count": len(FEATURE_COLUMNS),
            "trained_at": datetime.now(timezone.utc).isoformat(),
            **clf_metrics
        }
    ]
    await db.upsert_many("model_metrics", db_metrics, ["id"])

    print("WeatherGuard ML Pipeline Training Completed Successfully!", flush=True)
    print(f"Model A (Regressor)  -> MAE: {reg_metrics['mae']}, RMSE: {reg_metrics['rmse']}, R2: {reg_metrics['r2']}", flush=True)
    print(f"Model B (Classifier) -> ROC-AUC: {clf_metrics['roc_auc']}, PR-AUC: {clf_metrics['pr_auc']}, Brier: {clf_metrics['brier_score']}", flush=True)
    
    return reg_metrics, clf_metrics

if __name__ == "__main__":
    asyncio.run(train_models())
