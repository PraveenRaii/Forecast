from dataclasses import dataclass

@dataclass
class ConfidenceResult:
    score: int
    risk: str

def calculate_confidence(bust_probability: float, expected_error: float, historical_error: float, lead_time: int, ensemble_spread: float = 0) -> ConfidenceResult:
    # Centralized, interpretable prototype formula. Inputs are scaled before weighting.
    error_ratio = min(expected_error / max(historical_error, 0.1), 2) / 2
    lead_penalty = min(lead_time / 10, 1)
    spread_penalty = min(ensemble_spread / 20, 1)
    penalty = 0.55 * bust_probability + 0.25 * error_ratio + 0.12 * lead_penalty + 0.08 * spread_penalty
    score = round(max(0, min(100, 100 * (1 - penalty))))
    risk = "VERY_HIGH" if score < 30 else "HIGH" if score < 50 else "MODERATE" if score < 70 else "LOW" if score < 85 else "VERY_LOW"
    return ConfidenceResult(score, risk)
