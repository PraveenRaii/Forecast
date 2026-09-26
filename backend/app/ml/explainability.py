def explain_prediction(model, feature_names, row):
    """Returns SHAP contributors when shap is installed; avoids making causal claims."""
    try:
        import shap
        values = shap.TreeExplainer(model).shap_values([row])[0]
        return [{"feature": name, "impact": round(float(abs(value)), 4), "direction": "increase" if value > 0 else "decrease"} for name, value in sorted(zip(feature_names, values), key=lambda x: abs(x[1]), reverse=True)]
    except ImportError:
        return [{"feature": name, "impact": 0, "direction": "unavailable"} for name in feature_names]
