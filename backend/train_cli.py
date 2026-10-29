"""Standalone ML Model Trainer for WeatherGuard AI."""
import json
import os
from pathlib import Path
import time
import numpy as np
import sqlite3
from xgboost import XGBClassifier, XGBRegressor

print("Loading modules...", flush=True)
from app.data_sources.mock_weather import INDIAN_REGIONS, generate_synoptic_point
from app.ml.predict import FEATURE_COLUMNS
from app.ml.evaluate import evaluate_regression, evaluate_classification
from app.config import get_settings

def run_training():
    t0 = time.time()
    print("1. Generating 10-day meteorological verification records for 48 subdivisions...", flush=True)
    all_points = []
    for past_day in range(-6, 1):
        for lead in range(1, 11):
            for reg in INDIAN_REGIONS:
                all_points.append(generate_synoptic_point(reg, lead, past_day))
                
    print(f"Generated {len(all_points)} meteorological records in {round(time.time() - t0, 2)}s.", flush=True)

    # 2. Extract feature matrix X and targets
    all_points = sorted(all_points, key=lambda r: r.get("valid_time", ""))
    X = np.array([[float(r.get(c, 0.0)) for c in FEATURE_COLUMNS] for r in all_points])
    y_error = np.array([float(r.get("expected_error", r.get("rainfall_error", 2.0))) for r in all_points])
    y_bust = np.array([int(r.get("is_bust", int(r.get("bust_probability", 0) >= 0.5))) for r in all_points])

    # 80/20 train/test split
    split_idx = int(len(all_points) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_err_train, y_err_test = y_error[:split_idx], y_error[split_idx:]
    y_bust_train, y_bust_test = y_bust[:split_idx], y_bust[split_idx:]

    # 3. Train Model A - XGBoost Regressor
    print("2. Training Model A: XGBoost Regressor (Expected Error)...", flush=True)
    reg = XGBRegressor(n_estimators=40, max_depth=4, learning_rate=0.08, random_state=42)
    reg.fit(X_train, y_err_train)
    pred_err = reg.predict(X_test)
    reg_metrics = evaluate_regression(y_err_test, pred_err)

    # 4. Train Model B - XGBoost Classifier
    print("3. Training Model B: XGBoost Classifier (Bust Probability)...", flush=True)
    clf = XGBClassifier(n_estimators=40, max_depth=4, learning_rate=0.08, eval_metric="logloss", random_state=42)
    clf.fit(X_train, y_bust_train)
    proba_bust = clf.predict_proba(X_test)[:, 1]
    clf_metrics = evaluate_classification(y_bust_test, proba_bust)

    # 5. Save models to disk
    model_dir = Path(get_settings().ml_model_path)
    model_dir.mkdir(parents=True, exist_ok=True)
    reg.save_model(str(model_dir / "forecast_error_model.json"))
    clf.save_model(str(model_dir / "forecast_bust_model.json"))

    metadata = {
        "features": FEATURE_COLUMNS,
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "regression_metrics": reg_metrics,
        "classification_metrics": clf_metrics
    }
    with open(model_dir / "model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    # 6. Save data into SQLite database
    print("4. Persisting data into SQLite database...", flush=True)
    db_path = Path(__file__).resolve().parents[1] / "weather_guard.db"
    conn = sqlite3.connect(str(db_path))
    for col in ["confidence_scores", "forecasts", "forecast_errors", "regions", "model_metrics", "alerts", "data_sources"]:
        conn.execute(f"CREATE TABLE IF NOT EXISTS {col} (id TEXT PRIMARY KEY, data TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
    
    with conn:
        conn.executemany("INSERT OR REPLACE INTO confidence_scores (id, data) VALUES (?, ?)", [(p["id"], json.dumps(p)) for p in all_points])
        conn.executemany("INSERT OR REPLACE INTO forecasts (id, data) VALUES (?, ?)", [(p["id"], json.dumps(p)) for p in all_points])
        conn.executemany("INSERT OR REPLACE INTO regions (id, data) VALUES (?, ?)", [(r["id"], json.dumps(r)) for r in INDIAN_REGIONS])
        
        # Errors
        err_records = [(f"err-{p['id']}", json.dumps({
            "id": f"err-{p['id']}",
            "region_id": p["region_id"],
            "region": p["region"],
            "lead_time": p["lead_time"],
            "model": p["model"],
            "timestamp": p["timestamp"],
            "temperature_error": p["temperature_error"],
            "rainfall_error": p["rainfall_error"],
            "wind_error": p["wind_error"],
            "mae": p["expected_error"],
            "rmse": round(p["expected_error"] * 1.28, 2),
            "bias": round(p["temperature_2m"] - p["reference_temperature"], 2),
            "is_bust": p["is_bust"],
            "historical_error": p["historical_error"]
        })) for p in all_points]
        conn.executemany("INSERT OR REPLACE INTO forecast_errors (id, data) VALUES (?, ?)", err_records)

        # Metrics
        db_metrics = [
            ("metric-reg-1", json.dumps({"id": "metric-reg-1", "name": "Forecast Error Regression (Model A)", "model_type": "XGBoost Regressor", "target": "Expected Forecast Error (mm / °C)", "training_samples": len(all_points), "features_count": len(FEATURE_COLUMNS), **reg_metrics})),
            ("metric-clf-1", json.dumps({"id": "metric-clf-1", "name": "Forecast Bust Classification (Model B)", "model_type": "XGBoost Classifier", "target": "Forecast Bust Probability (P >= 90th percentile)", "training_samples": len(all_points), "features_count": len(FEATURE_COLUMNS), **clf_metrics}))
        ]
        conn.executemany("INSERT OR REPLACE INTO model_metrics (id, data) VALUES (?, ?)", db_metrics)

    conn.close()

    print("==================================================================", flush=True)
    print(" WeatherGuard AI ML Training & Verification Completed in", round(time.time() - t0, 2), "s", flush=True)
    print(f" Model A (Regression)     -> MAE: {reg_metrics['mae']}, RMSE: {reg_metrics['rmse']}, R2: {reg_metrics['r2']}", flush=True)
    print(f" Model B (Classification) -> ROC-AUC: {clf_metrics['roc_auc']}, PR-AUC: {clf_metrics['pr_auc']}, Brier: {clf_metrics['brier_score']}", flush=True)
    print(" Saved model weights to:", model_dir.resolve(), flush=True)
    print("==================================================================", flush=True)

if __name__ == "__main__":
    run_training()
