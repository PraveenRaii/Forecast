# WeatherGuard AI
### AI-Based NWP Forecast Confidence & Forecast Bust Detection System

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-teal.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)](https://reactjs.org/)
[![XGBoost](https://img.shields.io/badge/XGBoost-TreeSHAP-orange.svg)](https://xgboost.readthedocs.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 1. Project Overview

**WeatherGuard AI** is an operational AI decision-support platform designed for medium-range weather prediction across the Indian subcontinent.

> **Important Operational Principle**: WeatherGuard AI is a **Forecast Reliability / Forecast Confidence System**, NOT a normal weather forecasting website. The system answers:
> *"How much should an operational user trust this NWP forecast?"*
> rather than:
> *"What will tomorrow's weather be?"*

Medium-range Numerical Weather Prediction (NWP) simulations—such as NOAA GFS, ECMWF IFS, and GEFS ensembles—can develop massive operational errors during rapidly evolving tropical weather systems:
- Monsoon depressions & active/break phases
- Extreme convective precipitation events
- Western disturbances impacting northern plains and the Himalayas
- Tropical cyclogenesis & rapid track deviations in the Bay of Bengal and Arabian Sea
- Heat wave subsidence events

WeatherGuard AI analyzes incoming NWP forecasts, benchmarks them against historical ERA5 reanalysis ground truth, isolates learned error patterns, estimates catastrophic **forecast-bust probability**, computes a multi-penalty **spatial confidence score**, and generates exact **TreeSHAP** meteorological explainability.

---

## 2. Key Capabilities & 13 Dashboard Modules

The platform features 13 dedicated, responsive dashboard views:

1. **Landing / Home (`/`)**: Hero command center, India synoptic status, motivation cards, and monitored meteorological regimes.
2. **Operations Dashboard (`/dashboard`)**: 6 KPI cards, real-time alert feed, quick-action risk ranking, interactive Leaflet map preview, and bust histograms.
3. **India Confidence Map (`/forecast-map`)**: Interactive geospatial Leaflet map with a 5-tier confidence classification, Day 1–10 slider, and region diagnostic popups.
4. **Regional Subdivisions (`/regions`)**: 48 monitored Indian meteorological subdivisions with search, zone filtering, and risk ranking.
5. **Region Details (`/regions/:id`)**: 7 Recharts diagnostics (Forecast vs. Actual, Historical Error, Confidence Decay, Bust Escalation, Rain Error, Temp Error, Atmospheric Dynamics) + 10-day operational verification matrix.
6. **Forecast Bust Analysis (`/bust-analysis`)**: Catastrophic failure detection based on a configurable P90 historical error threshold, frequency distributions, and lead-time curves.
7. **Day 1–Day 10 Forecast Horizon (`/day-forecast`)**: Horizontal 10-day segmented lead-time selector tracking predictable skill decay across 240 hours.
8. **Explainable AI (`/explainability`)**: Exact TreeSHAP feature attributions explaining whether moisture depth, pressure gradient, CAPE, wind shear, or lead time caused low confidence.
9. **Historical Error Analysis (`/historical-errors`)**: Statistical validation metrics (MAE, RMSE, Bias, P90, P95) benchmarked against ERA5 truth.
10. **NWP Data Explorer (`/nwp-data`)**: Multi-level atmospheric grid explorer supporting NOAA GFS, ECMWF IFS, ECMWF AIFS, GEFS, and isobaric levels (1000–200 hPa).
11. **ML Model Performance (`/model-performance`)**: Statistical validation of Model A (XGBoost Regressor) and Model B (XGBoost Classifier) with a 1-click retrain trigger.
12. **API & Infrastructure Status (`/api-status`)**: Real-time status of NOAA GFS, ECMWF, ERA5, GEFS, SQLite database, and XGBoost inference runtime.
13. **Platform Settings (`/settings`)**: Configurable confidence alert cutoffs, bust percentile definitions, default models, and persistent preferences.
14. **Methodology & Architecture (`/about`)**: Complete mathematical formulation of the multi-penalty confidence engine and SVG architecture pipeline.

---

## 3. Technology Stack

### Frontend
- **React 18** with **Vite**
- **Tailwind CSS** (zero separate component CSS files, full responsive utility styling)
- **React Router v6** (with lazy loading and Suspense code splitting)
- **Leaflet & React-Leaflet** (geospatial confidence mapping with 5-tier color scale)
- **Recharts** (AreaChart, ComposedChart, BarChart, LineChart)
- **Lucide React** (modern iconography)
- **Axios** (centralized API client with error handling and retry utilities)

### Backend & Machine Learning
- **Python 3.11+**
- **FastAPI & Uvicorn** (asynchronous REST API with auto-generated OpenAPI docs at `/docs`)
- **Pydantic v2** (schema validation and settings management)
- **SQLite with WAL Mode** & PostGIS/PostgreSQL support
- **XGBoost & Scikit-learn**:
  - **Model A (Regressor)**: Predicts continuous expected forecast error (MAE).
  - **Model B (Classifier)**: Predicts probability of forecast bust ($|Forecast - Observation| \ge P_{90}$).
- **TreeSHAP**: Native Shapley Additive Explanations computing exact local feature attributions.

---

## 4. Confidence Engine Mathematical Formulation

The operational confidence score $C \in [10, 98]\%$ is calculated by deducting calibrated physical penalties from a theoretical baseline:

$$\text{Confidence} = C_{\text{base}} - P_{\text{lead}} - P_{\text{pressure}} - P_{\text{moisture}} - P_{\text{shear}} - P_{\text{error}}$$

Where:
- **Lead Time Decay**: $P_{\text{lead}} = (\text{lead\_time} - 1) \times 5.8\%$
- **MSL Pressure Drop**: $P_{\text{pressure}} = \max(0, 1012 - \text{MSLP}) \times 0.8\%$
- **Moisture Depth**: $P_{\text{moisture}} = \max(0, \text{RH} - 70) \times 0.35\%$
- **Vertical Wind Shear**: $P_{\text{shear}} = \text{wind\_speed} \times 0.25\%$
- **Historical Error Bias**: $P_{\text{error}} = \text{expected\_error} \times 1.4\%$

### 5-Tier Scientific Confidence Classification

| Tier | Score Range | Map Color | Description |
| :--- | :--- | :--- | :--- |
| **Very High** | 80% – 100% | Emerald (`#10b981`) | Stable synoptic regime; deterministic forecast reliable. |
| **High** | 65% – 79% | Cyan (`#06b6d4`) | Standard medium-range reliability; minor variance. |
| **Moderate** | 50% – 64% | Amber (`#eab308`) | Active convection or boundary layer uncertainty. |
| **Low** | 35% – 49% | Orange (`#f97316`) | Elevated bust probability; verify against ensemble spread. |
| **Very Low** | < 35% | Crimson (`#ef4444`) | Critical bust alert; extreme divergence expected. |

---

## 5. Machine Learning Validation Results

Evaluated on 3,430 meteorological records across 48 Indian subdivisions:

### Model A: XGBoost Forecast Error Regressor
- **Mean Absolute Error (MAE)**: `1.685 mm / °C`
- **Root Mean Squared Error (RMSE)**: `2.969 mm / °C`
- **Variance Explained ($R^2$)**: `0.970`

### Model B: XGBoost Forecast Bust Classifier ($P_{90}$ threshold)
- **ROC-AUC**: `0.773`
- **PR-AUC**: `0.762`
- **Brier Score**: `0.196`
- **Precision / Recall / F1**: `0.72 / 0.78 / 0.75`

---

## 6. How to Run Locally

### 1. Backend Setup

```powershell
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run ML pipeline trainer & populate database
python train_cli.py

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
API Documentation will be live at: `http://localhost:8000/docs`

### 2. Frontend Setup

```powershell
# Navigate to frontend directory
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 7. Scientific Attribution & Disclaimer

WeatherGuard AI is an operational AI decision-support prototype built for research and technical demonstration. It does not supersede official operational meteorological warnings issued by national meteorological authorities, including the **India Meteorological Department (IMD)**, **NOAA National Weather Service (NWS)**, or the **European Centre for Medium-Range Weather Forecasts (ECMWF)**.
