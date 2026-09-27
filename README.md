# Safar — Smart Alert for Forecast Accuracy and Reliability

Safar is an operations prototype that estimates the reliability of numerical weather prediction (NWP) guidance across India. It combines forecast variables, historical error patterns, an expected-error model, and a forecast-bust classifier into a confidence score and regional risk view.

> This system estimates forecast reliability using historical forecast-error patterns and machine-learning models. It is a decision-support prototype and does not replace official meteorological forecasts or operational warning systems.

## What is included

- A FastAPI backend with documented APIs at `/docs` and `/redoc`.
- A React + Vite + Tailwind dashboard with responsive map, charts, regional analysis, alerting, dark mode, and meaningful route pages.
- Deterministic, correlated India weather demo data spanning 50+ regions, seven historical cycles, and Day 1 to Day 10 lead times.
- MongoDB persistence with useful indexes and an automatic in-memory fallback, so the app works without a database.
- Dynamic NOAA GFS NOMADS URL construction for India bounds (68–98°E, 6–37°N), parameter validation, and provider interfaces for GFS and ECMWF.
- XGBoost time-split training entry point, centralized confidence formula, and optional SHAP explanation utility.

## Architecture

```text
GFS / ECMWF / Demo provider → normalized weather records → forecast errors & features
                                       ↓
                         XGBoost error + bust models
                                       ↓
                    confidence engine + alert service
                                       ↓
                  FastAPI → React map and operations dashboard
```

## Structure

```text
backend/app/
  api/routes/router.py       API endpoints
  data_sources/              provider interface, GFS, ECMWF
  processing/                GRIB normalization, features, errors
  services/                  confidence and alerts
  seed/seed_demo_data.py     correlated demo generator
  ml/train.py                time-aware XGBoost trainer
frontend/src/
  components/                map, charts, states, controls
  pages/                     dashboard and all analysis views
  services/api.js            centralized Axios client
```

## Run locally

### Backend

```powershell
cd backend
Copy-Item .env.example .env
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m app.seed.seed_demo_data
uvicorn app.main:app --reload --port 8000
```

### Frontend

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

- Dashboard: `http://localhost:5173`
- API: `http://localhost:8000/api/health`
- Swagger: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Configuration

Copy `backend/.env.example` to `backend/.env`. Keep credentials only in this local file; it is excluded from Git. Key settings are:

| Setting | Purpose |
| --- | --- |
| `DATA_MODE=demo` | Runs correlated synthetic data with no network or MongoDB requirement. |
| `MONGODB_URI` | Optional Atlas connection. When unavailable Safar uses in-memory data. |
| `NOMADS_ENABLED` | Allows the GFS provider. |
| `ECMWF_ENABLED`, `ECMWF_API_KEY` | Enables the ECMWF integration layer when a delivery client is configured. |
| `BUST_PERCENTILE` | Operational threshold configuration, default `90`. |

## Demo and live NWP modes

Demo mode is the default and identifies data as **DEMO DATA** in the dashboard. It generates correlated temperature, humidity, pressure, wind, and rainfall patterns including monsoon, disturbance, and low-confidence conditions.

Set `DATA_MODE=live` to activate the GFS request path. `build_gfs_url()` builds a date-, cycle-, hour-, variable-, level-, and bounds-specific request, validating supported GFS field combinations first. Production GRIB parsing requires host-level `eccodes` and `cfgrib`; the API reports a friendly status when they are absent. ECMWF is intentionally disabled unless local credentials and an appropriate provider client are configured.

## ML training

After MongoDB has sufficient forecast verification data:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m app.ml.train
```

The training module sorts rows by valid time and uses an 80/20 chronological split, then saves XGBoost model artifacts beneath `ML_MODEL_PATH`. Demo mode exposes baseline metrics so the UI remains useful before training. The explanation endpoint labels factors as model contributors, not causes.

## API overview

| Area | Routes |
| --- | --- |
| Health | `GET /api/health`, `GET /api/data/status` |
| Dashboard | `GET /api/dashboard/summary`, `GET /api/confidence-map` |
| Forecast and risk | `GET /api/forecast`, `/confidence`, `/bust-probability` |
| Region and errors | `GET /api/regions`, `/regions/{id}`, `/errors/history` |
| Model | `GET /api/explanation/{id}/{lead}`, `/model/performance` |
| NWP | `GET /api/nwp/variables`, `/metadata`, `/status`; `POST /api/nwp/ingest` |

## Troubleshooting

- If MongoDB is unavailable, leave `MONGODB_URI` unset and run in demo mode.
- If the browser cannot reach the API, verify `VITE_API_URL` and `FRONTEND_URL` match the local ports.
- NOMADS can publish runs late. The provider validates request parameters and returns errors instead of crashing. Use demo mode until a valid run is available.
- Live GRIB decoding needs `eccodes` installed by the operating system in addition to the Python packages.

## Deploy on Render

This repository includes a Render Blueprint at `render.yaml` for a FastAPI web service and a Vite static site. To deploy:

1. Push the repository to GitHub.
2. In Render, choose **New + → Blueprint** and connect this GitHub repository.
3. Review the two services (`safar-api` and `safar-forecast`) and click **Apply**.
4. Wait for both deployments to finish, then open `https://safar-forecast.onrender.com`.

The Blueprint sets demo mode and the API/frontend URLs for the service names above. If Render requires different globally unique service names, update `FRONTEND_URL` on `safar-api` and `VITE_API_URL` on `safar-forecast` to match the new `onrender.com` URLs, then redeploy both services. The demo data is held in process memory when MongoDB is not configured, so it is regenerated on API restarts. Add a MongoDB Atlas URI as the `MONGODB_URI` secret on the API service if you need persistence. Render's free web services may sleep when idle and take time to wake on the next request.

## Future scope

Connect operational observation and reanalysis feeds, persist a real validation archive, enable ECMWF delivery retrieval, operationalize model monitoring, add authenticated alert delivery, and run GRIB ingestion in a background worker.
