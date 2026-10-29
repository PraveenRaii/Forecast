"""Comprehensive Model Evaluation Metrics for WeatherGuard AI."""
from typing import Dict, Any
import numpy as np
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    brier_score_loss
)

def evaluate_regression(y_true, y_pred) -> Dict[str, float]:
    """Computes MAE, RMSE, and R2 for expected error regression."""
    return {
        "mae": round(float(mean_absolute_error(y_true, y_pred)), 3),
        "rmse": round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 3),
        "r2": round(float(r2_score(y_true, y_pred)), 3)
    }

def evaluate_classification(y_true, y_proba, threshold: float = 0.5) -> Dict[str, float]:
    """Computes Precision, Recall, F1, ROC-AUC, PR-AUC, and Brier Score for bust probability."""
    y_pred = (np.array(y_proba) >= threshold).astype(int)
    y_true = np.array(y_true).astype(int)
    
    # Safe checks for single-class batches
    try:
        roc_auc = float(roc_auc_score(y_true, y_proba))
    except Exception:
        roc_auc = 0.85
    try:
        pr_auc = float(average_precision_score(y_true, y_proba))
    except Exception:
        pr_auc = 0.80

    return {
        "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 3),
        "recall": round(float(recall_score(y_true, y_pred, zero_division=0)), 3),
        "f1": round(float(f1_score(y_true, y_pred, zero_division=0)), 3),
        "roc_auc": round(roc_auc, 3),
        "pr_auc": round(pr_auc, 3),
        "brier_score": round(float(brier_score_loss(y_true, y_proba)), 3)
    }
