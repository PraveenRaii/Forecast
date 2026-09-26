"""Time-aware ML training pipeline; run with `python -m app.ml.train`."""
from pathlib import Path
import asyncio
import joblib
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, precision_score, recall_score, f1_score, roc_auc_score, average_precision_score, brier_score_loss
from xgboost import XGBRegressor, XGBClassifier
from ..database import db
from ..config import get_settings

FEATURES = ["lead_time", "temperature_2m", "relative_humidity", "rainfall", "pressure_msl", "wind_speed", "historical_error"]
async def train():
    await db.connect()
    rows = sorted(await db.all("confidence_scores"), key=lambda r: r["valid_time"])
    if len(rows) < 50: raise RuntimeError("At least 50 records are required to train models")
    X = np.array([[r[f] for f in FEATURES] for r in rows]); y_error=np.array([r["expected_error"] for r in rows]); y_bust=np.array([int(r["bust_probability"] >= .5) for r in rows])
    split = int(len(rows)*.8); X_train,X_test=X[:split],X[split:]
    reg=XGBRegressor(n_estimators=100,max_depth=4,learning_rate=.06); clf=XGBClassifier(n_estimators=100,max_depth=4,learning_rate=.06,eval_metric="logloss")
    reg.fit(X_train,y_error[:split]); clf.fit(X_train,y_bust[:split]); pred=reg.predict(X_test); proba=clf.predict_proba(X_test)[:,1]; label=(proba>=.5).astype(int)
    model_dir=Path(get_settings().ml_model_path); model_dir.mkdir(parents=True,exist_ok=True); reg.save_model(model_dir/'forecast_error_model.json'); clf.save_model(model_dir/'forecast_bust_model.json'); joblib.dump({"features":FEATURES},model_dir/'metadata.joblib')
    metrics={"name":"trained regression","mae":float(mean_absolute_error(y_error[split:],pred)),"rmse":float(mean_squared_error(y_error[split:],pred)**.5),"r2":float(r2_score(y_error[split:],pred))}
    cls={"name":"trained classifier","precision":float(precision_score(y_bust[split:],label,zero_division=0)),"recall":float(recall_score(y_bust[split:],label,zero_division=0)),"f1":float(f1_score(y_bust[split:],label,zero_division=0)),"roc_auc":float(roc_auc_score(y_bust[split:],proba)),"pr_auc":float(average_precision_score(y_bust[split:],proba)),"brier_score":float(brier_score_loss(y_bust[split:],proba))}
    await db.upsert_many("model_metrics",[metrics,cls],["name"]); return metrics,cls
if __name__ == "__main__": print(asyncio.run(train()))
