"""WeatherGuard Confidence Engine.

Algorithm Documentation:
NWP Forecast Confidence is computed via a multi-component reliability synthesis:
1. Bust Probability Penalty (Weight: 50%): Probability that error exceeds 90th percentile threshold.
2. Error Ratio Penalty (Weight: 24%): Ratio of currently expected forecast error relative to the regional historical baseline.
3. Lead Time Degradation Penalty (Weight: 14%): Inherent exponential loss of atmospheric predictability (Lorenz limit) over 10-day lead time.
4. Ensemble Spread / Atmospheric Volatility Penalty (Weight: 12%): Spread across ensemble perturbations (GEFS / EPS) and mesoscale shear.

Formula:
Total Penalty = (0.50 * P_bust) + (0.24 * min(expected_err / max(historical_err, 0.1), 2.0) / 2.0) + (0.14 * (lead_time / 10.0)) + (0.12 * min(spread / 5.0, 1.0))
Confidence Score = round(clamp(100 * (1.0 - Total Penalty), 5, 98))

Risk Levels:
- VERY_LOW:  Confidence >= 85%
- LOW:       70% <= Confidence < 85%
- MODERATE:  50% <= Confidence < 70%
- HIGH:      30% <= Confidence < 50%
- VERY_HIGH: Confidence < 30%
"""
from dataclasses import dataclass

@dataclass
class ConfidenceResult:
    score: int
    risk: str
    bust_penalty: float
    error_penalty: float
    lead_penalty: float
    spread_penalty: float

def calculate_confidence(
    bust_probability: float,
    expected_error: float,
    historical_error: float,
    lead_time: int,
    ensemble_spread: float = 1.0
) -> ConfidenceResult:
    """Computes transparent, reproducible forecast confidence score from 0 to 100."""
    error_ratio = min(expected_error / max(historical_error, 0.1), 2.0) / 2.0
    lead_penalty = min(lead_time / 10.0, 1.0)
    spread_penalty = min(ensemble_spread / 5.0, 1.0)
    
    total_penalty = (
        0.50 * bust_probability +
        0.24 * error_ratio +
        0.14 * lead_penalty +
        0.12 * spread_penalty
    )
    
    score = round(max(5, min(98, 100 * (1.0 - total_penalty))))
    
    if score >= 85:
        risk = "VERY_LOW"
    elif score >= 70:
        risk = "LOW"
    elif score >= 50:
        risk = "MODERATE"
    elif score >= 30:
        risk = "HIGH"
    else:
        risk = "VERY_HIGH"
        
    return ConfidenceResult(
        score=score,
        risk=risk,
        bust_penalty=round(0.50 * bust_probability, 3),
        error_penalty=round(0.24 * error_ratio, 3),
        lead_penalty=round(0.14 * lead_penalty, 3),
        spread_penalty=round(0.12 * spread_penalty, 3)
    )
