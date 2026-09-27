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

The repository includes `render.yaml`, which defines the FastAPI backend and React/Vite frontend. You can deploy both together with the Blueprint, or create each service manually.

Render's official guides: [Blueprint specification](https://render.com/docs/blueprint-spec), [first deploy walkthrough](https://render.com/docs/your-first-deploy), and [Python version configuration](https://render.com/docs/python-version).

### Render environment variables

Add variables on the matching Render service under **Environment → Environment Variables**. The Blueprint supplies the demo defaults shown below. For manual setup, add the required rows yourself. Keep database URLs and API keys in Render's environment settings; never commit secrets to this repository.

#### Backend (`safar-api` Web Service)

| Variable | Required? | Render value / default | What it does |
| --- | --- | --- | --- |
| `PYTHON_VERSION` | Recommended | `3.12.8` | Selects the Python runtime for the Render build. |
| `DATA_MODE` | Yes for this demo deployment | `demo` | Seeds synthetic demo forecasts on startup. `live` switches away from demo data and uses the GFS request path, which needs working provider access and GRIB decoding for full ingestion. |
| `FRONTEND_URL` | Yes | `https://<your-frontend-name>.onrender.com` | Exact frontend origin allowed by the API's CORS configuration. Do not add a trailing slash. |
| `MONGODB_URI` | No | Leave unset for the demo, or enter your private Atlas connection string | Connects MongoDB for persistence. Add it as a secret in Render; replace Atlas IP allow-list settings as needed for your deployment. |
| `MONGODB_DB` | No | `weather_guard` | MongoDB database name. |
| `NOMADS_ENABLED` | No | `true` | GFS/NOMADS provider enabled setting reported by the API. |
| `NOMADS_BASE_URL` | No | `https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl` | NOAA NOMADS GFS filter endpoint. |
| `ECMWF_ENABLED` | No | `false` | ECMWF provider status setting. The repository does not yet include a working ECMWF delivery client. |
| `ECMWF_API_KEY` | No | Leave unset unless configuring ECMWF | Optional credential setting. Store it only in Render; an API key alone does not enable a data client. |
| `BUST_PERCENTILE` | No | `90` | Reserved threshold setting; the current demo bust labels do not use this value. |
| `ML_MODEL_PATH` | No | `./ml_models` | Local path for optional trained model artifacts. Render's normal filesystem is temporary, so use MongoDB or another durable store for data you need to retain. |

For a basic demo, set `PYTHON_VERSION`, `DATA_MODE`, and `FRONTEND_URL`; leave the other variables at their defaults. The backend reads the remaining optional values from the environment or uses the defaults above.

#### Frontend (`safar-forecast` Static Site)

| Variable | Required? | Value | What it does |
| --- | --- | --- | --- |
| `VITE_API_URL` | Yes | `https://<your-backend-name>.onrender.com/api` | Public backend API base URL. Set it before deploying the frontend. Vite embeds it during the build, so changing it requires a new frontend deploy. |

There are no other frontend environment variables in this app. Locally, if `VITE_API_URL` is absent, the frontend falls back to `http://localhost:8000/api`.

### Option A: Deploy both services with the Blueprint

1. Push this repository to GitHub. The deployment branch is `main`.
2. Sign in to [Render](https://dashboard.render.com/).
3. Select **New + → Blueprint**.
4. Connect GitHub if prompted, select `PraveenRaii/Forecast`, and choose the `main` branch.
5. Render reads `render.yaml` and shows two services: `safar-api` (backend) and `safar-forecast` (frontend). Review the settings and select **Apply**.
6. Open each service in Render and wait for its first deploy to finish. Check the deploy logs if either service fails.
7. Open the frontend at `https://safar-forecast.onrender.com`. Check the backend at `https://safar-api.onrender.com/api/health` and the API documentation at `https://safar-api.onrender.com/docs`.

The Blueprint configures the backend with `DATA_MODE=demo` and `FRONTEND_URL=https://safar-forecast.onrender.com`. It configures the frontend with `VITE_API_URL=https://safar-api.onrender.com/api` and an SPA rewrite so page refreshes work on frontend routes.

### Option B: Create the backend and frontend separately

Deploy the backend first so you have its public URL for the frontend configuration.

#### 1. Create the FastAPI backend

1. In Render, select **New + → Web Service**, connect this GitHub repository, and select the `main` branch.
2. Set **Root Directory** to `backend` and **Runtime** to `Python 3`.
3. Set **Build Command** to `pip install -r requirements.txt`.
4. Set **Start Command** to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Add the backend environment variables under **Environment**. For the demo, set `PYTHON_VERSION=3.12.8`, `DATA_MODE=demo`, and `FRONTEND_URL` to your final frontend URL. You can first use the planned frontend URL, then update it after you create the static site. See [Render environment variables](#render-environment-variables) for all backend options.

6. Select **Create Web Service** and wait for the deploy to finish. Copy the service URL, for example `https://safar-api.onrender.com`.
7. Verify `https://<your-backend-name>.onrender.com/api/health` returns a JSON response with `"status":"ok"`.

#### 2. Create the React/Vite frontend

1. In Render, select **New + → Static Site**, connect the same repository, and select the `main` branch.
2. Set **Root Directory** to `frontend`.
3. Set **Build Command** to `npm ci && npm run build`.
4. Set **Publish Directory** to `dist`.
5. Add `VITE_API_URL`, substituting your actual backend service name (see [frontend environment variables](#frontend-safar-forecast-static-site)):

6. Add a rewrite rule so React Router can serve direct page links: **Source** `/*`, **Destination** `/index.html`, **Action** `Rewrite`.
7. Select **Create Static Site** and wait for the deploy. Copy the frontend URL, for example `https://safar-forecast.onrender.com`.
8. Return to the backend service's **Environment** settings and set `FRONTEND_URL` to the exact frontend URL, with no trailing slash. Save the change and redeploy the backend.
9. Open the frontend URL, then verify the dashboard loads data. Also recheck the backend `/api/health` and `/docs` links.

### Optional MongoDB persistence

The app runs in demo mode without MongoDB; demo records are kept in memory and are regenerated after backend restarts. For persistence, create a MongoDB Atlas database, allow network access from Render as appropriate for your Atlas setup, and add `MONGODB_URI` as a secret environment variable on the backend service. You can also set `MONGODB_DB` if you want a database name other than `weather_guard`. Keep credentials in Render's Environment settings; do not commit them to GitHub. The backend will use its in-memory fallback if MongoDB cannot be reached.

### Updating a deployment

Push code changes to the connected GitHub branch. Render will deploy the updated services automatically if auto-deploy is enabled; otherwise, open each service and select **Manual Deploy → Deploy latest commit**. When changing `VITE_API_URL`, trigger a new frontend build because Vite embeds that value into the built site. Free Render web services may sleep while idle and take a little time to respond to the first request after waking.

## Future scope

Connect operational observation and reanalysis feeds, persist a real validation archive, enable ECMWF delivery retrieval, operationalize model monitoring, add authenticated alert delivery, and run GRIB ingestion in a background worker.
