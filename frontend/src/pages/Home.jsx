import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  ArrowRight,
  MapPin,
  TrendingUp,
  BrainCircuit,
  Database,
  CloudRain,
  AlertTriangle,
  Wind,
  Layers,
  Activity,
  CheckCircle2,
  Compass
} from 'lucide-react'

export default function Home() {
  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 px-6 py-16 text-white shadow-xl dark:border-slate-800 sm:px-12 lg:py-24">
        {/* Synoptic background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
              <ShieldAlert size={14} className="text-cyan-400" />
              Operational Reliability Intelligence
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">
              WeatherGuard <span className="text-cyan-400">AI</span>
            </h1>

            <p className="text-lg font-medium text-cyan-100 sm:text-xl">
              AI-powered forecast confidence and forecast-bust detection for medium-range weather prediction.
            </p>

            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              Analyze NWP forecast reliability, identify high-risk regions across India, estimate forecast-bust probability,
              and understand the meteorological factors behind low-confidence forecasts.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition-all hover:bg-cyan-400 hover:shadow-cyan-500/40"
              >
                Open Dashboard <ArrowRight size={17} />
              </Link>
              <Link
                to="/forecast-map"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-slate-700 hover:border-slate-600"
              >
                <Compass size={17} className="text-cyan-400" /> Explore Forecast Map
              </Link>
            </div>
          </div>

          {/* Hero Visual Card - India Synoptic Preview */}
          <div className="relative rounded-xl border border-cyan-500/20 bg-slate-950/60 p-5 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-bold text-slate-300">NWP Reliability Status: Active Synoptic Ingestion</span>
              </div>
              <span className="rounded bg-cyan-900/40 px-2 py-0.5 text-[11px] font-semibold text-cyan-400">
                NOAA GFS + ERA5
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-semibold text-white">National Confidence Index</span>
                  <span className="font-bold text-cyan-400 text-sm">68% (Moderate)</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: '68%' }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">High-Risk Regions</span>
                  <span className="font-bold text-base text-orange-400">12 / 48 Areas</span>
                </div>
                <div className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Forecast Bust Risk</span>
                  <span className="font-bold text-base text-red-400">31.4% (Lead D5)</span>
                </div>
              </div>

              <div className="rounded-lg bg-cyan-950/40 p-2.5 border border-cyan-800/40 text-[11px] text-cyan-200">
                <span className="font-semibold block mb-0.5">Primary Uncertainty Driver:</span>
                Bay of Bengal monsoon depression rapid cyclogenesis &amp; high CAPE convection.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Why WeatherGuard AI? */}
      <section className="space-y-6">
        <div>
          <p className="label text-cyan-700 dark:text-cyan-400 font-bold">Scientific Motivation</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Why WeatherGuard AI?
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Numerical Weather Prediction models (such as NOAA GFS, ECMWF IFS) are sophisticated physical simulations of the atmosphere.
            However, operational meteorologists encounter severe forecast busts during rapid atmospheric regime shifts.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: 'NWP Fails in Dynamic Regimes',
              desc: 'Physical parameterizations struggle during monsoon depressions, western disturbances, cyclones, and sudden convective triggers.',
              icon: AlertTriangle,
              color: 'text-amber-500'
            },
            {
              title: 'Operational Decisions Need Trust',
              desc: 'Disaster authorities, aviation, and power grids need to know "How much can we trust this forecast?" not just the deterministic output.',
              icon: CheckCircle2,
              color: 'text-emerald-500'
            },
            {
              title: 'Error Patterns are Learnable',
              desc: 'Historical forecast-minus-observation errors correlate strongly with lead time, moisture depth, pressure trends, and wind shear.',
              icon: BrainCircuit,
              color: 'text-cyan-500'
            },
            {
              title: 'Targeted High-Risk Detection',
              desc: 'Dual XGBoost ML models isolate specific geographic subdivisions and lead times (Day 1–10) with elevated bust probability.',
              icon: MapPin,
              color: 'text-indigo-500'
            }
          ].map((item) => (
            <div key={item.title} className="card relative group hover:border-cyan-500/50 transition-all">
              <item.icon className={`${item.color} mb-3`} size={24} />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{item.title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Key Capabilities */}
      <section className="space-y-6">
        <div>
          <p className="label text-cyan-700 dark:text-cyan-400 font-bold">Platform Features</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Key Capabilities
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Day 1–10 Confidence Decay',
              desc: 'Continuous reliability scoring evaluating how NWP simulation skill degrades over 10 consecutive lead days.',
              link: '/day-forecast',
              icon: TrendingUp
            },
            {
              title: 'Forecast Bust Probability',
              desc: 'Calibrated binary classification detecting catastrophic forecast busts (exceeding historical 90th percentile error).',
              link: '/bust-analysis',
              icon: ShieldAlert
            },
            {
              title: 'India Confidence Map',
              desc: 'Geospatial 5-tier reliability heatmap covering 48 meteorological subdivisions across India with interactive diagnostics.',
              link: '/forecast-map',
              icon: Compass
            },
            {
              title: 'Historical Error Analysis',
              desc: 'Systematic verification metrics (MAE, RMSE, Bias, P90, P95) benchmarked against reanalysis truth.',
              link: '/historical-errors',
              icon: Activity
            },
            {
              title: 'Explainable AI (TreeSHAP)',
              desc: 'Exact local Shapley attribution explaining whether CAPE, wind shear, moisture, or pressure caused low confidence.',
              link: '/explainability',
              icon: BrainCircuit
            },
            {
              title: 'NWP Data Ingestion',
              desc: 'Abstracted architecture ready for NOAA GFS 0.25°, ECMWF IFS, ERA5 Copernicus, and 31-member GEFS ensembles.',
              link: '/nwp-data',
              icon: Database
            }
          ].map((card) => (
            <Link
              key={card.title}
              to={card.link}
              className="card group hover:border-cyan-500 hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <card.icon className="text-cyan-700 dark:text-cyan-400 group-hover:scale-110 transition-transform" size={24} />
                <h3 className="mt-4 font-bold text-base text-slate-900 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-400">
                  {card.title}
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {card.desc}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                Explore feature <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Synoptic Extreme Weather Scenarios */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          Critical Meteorological Regimes Monitored
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          WeatherGuard AI specifically detects forecast vulnerability during active Indian synoptic transitions.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-xs">
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
            <span className="font-bold block text-slate-800 dark:text-slate-200">Monsoon Depression</span>
            <span className="text-slate-500 mt-1 block">Bay of Bengal low-pressure systems with extreme rainfall uncertainty.</span>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
            <span className="font-bold block text-slate-800 dark:text-slate-200">Western Disturbance</span>
            <span className="text-slate-500 mt-1 block">Mid-latitude extra-tropical storms impacting Himalayas &amp; NW plains.</span>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
            <span className="font-bold block text-slate-800 dark:text-slate-200">Tropical Cyclones</span>
            <span className="text-slate-500 mt-1 block">Rapid intensification and track deviation in North Indian Ocean.</span>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
            <span className="font-bold block text-slate-800 dark:text-slate-200">Severe Heat Waves</span>
            <span className="text-slate-500 mt-1 block">Anticyclonic subsidence causing temperature forecast overshoots.</span>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
            <span className="font-bold block text-slate-800 dark:text-slate-200">Strong Convection</span>
            <span className="text-slate-500 mt-1 block">High CAPE mesoscale convective systems that evade coarse NWP grids.</span>
          </div>
        </div>
      </section>
    </div>
  )
}
