import React from 'react'
import {
  ShieldAlert,
  BrainCircuit,
  Database,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  Activity,
  Cpu,
  Compass
} from 'lucide-react'

export default function About() {
  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="label text-cyan-700 dark:text-cyan-400 font-bold">SCIENTIFIC FOUNDATIONS</span>
          <span className="rounded bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
            RESEARCH PROTOTYPE
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl mt-1">
          WeatherGuard AI Methodology &amp; Architecture
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          A machine learning decision-support framework for Numerical Weather Prediction (NWP) forecast reliability assessment
        </p>
      </div>

      {/* 1. Core Problem & Paradigm */}
      <section className="card space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-2 dark:border-slate-800">
          1. The Core Scientific Paradigm
        </h2>
        <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 space-y-3">
          <p>
            Modern Numerical Weather Prediction (NWP) systems—including NOAA’s Global Forecast System (GFS)
            and ECMWF’s Integrated Forecasting System (IFS)—solve the non-linear primitive Navier-Stokes equations
            on discretized global grids. While medium-range forecast skill has steadily improved, operational forecasts
            frequently suffer catastrophic <strong>forecast busts</strong> during rapid atmospheric regime shifts.
          </p>
          <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-4 dark:border-cyan-900/40 dark:bg-cyan-950/20">
            <span className="font-bold text-cyan-900 dark:text-cyan-200 block mb-1">
              The WeatherGuard AI Principle:
            </span>
            <p className="text-cyan-800 dark:text-cyan-300 italic">
              "WeatherGuard AI does NOT replace NWP forecasting. Its objective is to answer:
              <strong> 'How much should an operational user trust this NWP forecast?'</strong> rather than
              'What will tomorrow's weather be?'"
            </p>
          </div>
          <p>
            By systematically comparing historical NWP forecasts against observation/reanalysis truth (ERA5),
            the system trains machine learning models to identify geographical regions, synoptic regimes, and lead times
            where forecast uncertainty is statistically elevated.
          </p>
        </div>
      </section>

      {/* 2. System Architecture SVG Diagram */}
      <section className="card space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-2 dark:border-slate-800">
          2. End-to-End System Architecture
        </h2>
        <p className="text-xs text-slate-500">
          Data flow from NWP global providers to feature engineering, dual ML inference, and geospatial dashboard
        </p>

        {/* SVG Architecture Diagram */}
        <div className="rounded-xl border border-slate-200 bg-slate-950 p-6 shadow-inner text-white overflow-x-auto">
          <svg className="w-full min-w-[700px] h-64" viewBox="0 0 800 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Box 1: Ingestion */}
            <rect x="20" y="30" width="160" height="180" rx="10" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            <text x="100" y="60" textAnchor="middle" fill="#38bdf8" fontWeight="bold" fontSize="13">NWP Ingestion Layer</text>
            <text x="100" y="90" textAnchor="middle" fill="#94a3b8" fontSize="11">• NOAA GFS 0.25°</text>
            <text x="100" y="115" textAnchor="middle" fill="#94a3b8" fontSize="11">• ECMWF IFS / AIFS</text>
            <text x="100" y="140" textAnchor="middle" fill="#94a3b8" fontSize="11">• ERA5 Reanalysis</text>
            <text x="100" y="165" textAnchor="middle" fill="#94a3b8" fontSize="11">• GEFS 31-Ensemble</text>
            <text x="100" y="190" textAnchor="middle" fill="#38bdf8" fontSize="10">GRIB2 / NetCDF4</text>

            {/* Arrow 1 */}
            <path d="M185 120 H235" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />

            {/* Box 2: Preprocessing & Feature Engineering */}
            <rect x="240" y="30" width="160" height="180" rx="10" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            <text x="320" y="60" textAnchor="middle" fill="#a855f7" fontWeight="bold" fontSize="13">Feature Engineering</text>
            <text x="320" y="90" textAnchor="middle" fill="#94a3b8" fontSize="11">• Lead Time Decays</text>
            <text x="320" y="115" textAnchor="middle" fill="#94a3b8" fontSize="11">• MSLP Gradients (ΔP)</text>
            <text x="320" y="140" textAnchor="middle" fill="#94a3b8" fontSize="11">• Moisture Depths (RH)</text>
            <text x="320" y="165" textAnchor="middle" fill="#94a3b8" fontSize="11">• Wind Shear Vectors</text>
            <text x="320" y="190" textAnchor="middle" fill="#a855f7" fontSize="10">14 Synoptic Inputs</text>

            {/* Arrow 2 */}
            <path d="M405 120 H455" stroke="#a855f7" strokeWidth="2" markerEnd="url(#arrow)" />

            {/* Box 3: Dual XGBoost ML Models */}
            <rect x="460" y="30" width="160" height="180" rx="10" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            <text x="540" y="60" textAnchor="middle" fill="#34d399" fontWeight="bold" fontSize="13">XGBoost ML Pipeline</text>
            <text x="540" y="90" textAnchor="middle" fill="#94a3b8" fontSize="11">Model A: Regressor</text>
            <text x="540" y="110" textAnchor="middle" fill="#34d399" fontSize="10">Expected Error (MAE)</text>
            <text x="540" y="140" textAnchor="middle" fill="#94a3b8" fontSize="11">Model B: Classifier</text>
            <text x="540" y="160" textAnchor="middle" fill="#f97316" fontSize="10">Bust Prob (y &gt; P90)</text>
            <text x="540" y="190" textAnchor="middle" fill="#34d399" fontSize="10">TreeSHAP Explainers</text>

            {/* Arrow 3 */}
            <path d="M625 120 H675" stroke="#34d399" strokeWidth="2" />

            {/* Box 4: Presentation & UI */}
            <rect x="680" y="30" width="105" height="180" rx="10" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            <text x="732" y="60" textAnchor="middle" fill="#f59e0b" fontWeight="bold" fontSize="13">Dashboard</text>
            <text x="732" y="95" textAnchor="middle" fill="#94a3b8" fontSize="10">Leaflet Map</text>
            <text x="732" y="125" textAnchor="middle" fill="#94a3b8" fontSize="10">5-Tier Tiers</text>
            <text x="732" y="155" textAnchor="middle" fill="#94a3b8" fontSize="10">SHAP Bars</text>
            <text x="732" y="185" textAnchor="middle" fill="#f59e0b" fontSize="10">Alert Feed</text>
          </svg>
        </div>
      </section>

      {/* 3. Mathematical Confidence Formulation */}
      <section className="card space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-2 dark:border-slate-800">
          3. Multi-Penalty Confidence Engine Formulation
        </h2>
        <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 space-y-3">
          <p>
            The continuous operational confidence score <code>C ∈ [10, 98]%</code> is determined by starting from a theoretical baseline
            and subtracting calibrated non-linear physical penalties:
          </p>

          <div className="rounded-xl bg-slate-900 p-4 text-cyan-300 font-mono text-xs overflow-x-auto">
            Confidence = C_base - Penalty_lead - Penalty_pressure - Penalty_moisture - Penalty_shear - Penalty_error
          </div>

          <div className="grid gap-3 sm:grid-cols-2 text-xs pt-1">
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Lead Time Decay:</span>
              <code className="text-cyan-700 dark:text-cyan-400">Penalty_lead = (lead_time - 1) × 5.8%</code>
              <p className="mt-1 text-[11px] text-slate-500">Reflects theoretical loss of deterministic skill in chaotic atmospheres.</p>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Pressure Instability:</span>
              <code className="text-cyan-700 dark:text-cyan-400">Penalty_pressure = max(0, 1012 - MSLP) × 0.8%</code>
              <p className="mt-1 text-[11px] text-slate-500">Penalizes steep depressions and cyclonic circulations.</p>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Moisture Depth (RH):</span>
              <code className="text-cyan-700 dark:text-cyan-400">Penalty_moisture = max(0, RH - 70) × 0.35%</code>
              <p className="mt-1 text-[11px] text-slate-500">Compensates for parameterized deep moist convective uncertainty.</p>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Vertical Wind Shear:</span>
              <code className="text-cyan-700 dark:text-cyan-400">Penalty_shear = wind_speed × 0.25%</code>
              <p className="mt-1 text-[11px] text-slate-500">Accounts for momentum transport and boundary layer mixing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Forecast Bust Classification Rule */}
      <section className="card space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-2 dark:border-slate-800">
          4. Machine Learning &amp; Bust Definition
        </h2>
        <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 space-y-2">
          <p>
            A <strong>forecast bust</strong> represents a catastrophic operational failure where numerical simulation error
            renders the forecast actively misleading for downstream emergency or utility planning.
          </p>
          <p>
            In the WeatherGuard AI prototype, ground truth verification records from ERA5 are analyzed across each subdivision
            and lead time. If the forecast error exceeds the <strong>90th percentile</strong> of the historical error distribution,
            it is labeled as <code>bust = 1</code>, otherwise <code>bust = 0</code>.
          </p>
          <p>
            Model B (XGBoost Classifier) evaluates non-linear atmospheric interactions to output calibrated bust probabilities
            evaluated by ROC-AUC (0.773) and Brier Score (0.196). TreeSHAP then generates exact Shapley attributions for full transparency.
          </p>
        </div>
      </section>

      {/* 5. Scientific Honesty & Academic Attribution */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300 leading-relaxed space-y-1">
        <div className="flex items-center gap-2 font-bold">
          <AlertTriangle size={15} className="text-amber-600" />
          Academic Prototype Notice &amp; Operational Warning Compliance
        </div>
        <p>
          WeatherGuard AI is an operational AI decision-support prototype built for meteorological research and college SIH technical demonstration.
          It does not supersede official operational meteorological warnings issued by national agencies such as the India Meteorological Department (IMD),
          NOAA National Weather Service, or ECMWF.
        </p>
      </div>
    </div>
  )
}
