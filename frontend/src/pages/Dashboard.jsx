import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  Activity,
  Layers,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  ExternalLink
} from 'lucide-react'
import { getMap, getSummary, getAlerts } from '../services/api'
import KPIcard from '../components/KPIcard'
import DaySelector from '../components/DaySelector'
import ConfidenceMap, { getConfidenceTier } from '../components/ConfidenceMap'
import { BustBars } from '../components/Charts'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import RiskBadge from '../components/RiskBadge'

export default function Dashboard() {
  const [day, setDay] = useState(1)
  const [summary, setSummary] = useState(null)
  const [mapData, setMapData] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const loadData = async (leadTime = day) => {
    setError(null)
    try {
      const [sumRes, mapRes, alertRes] = await Promise.all([
        getSummary(leadTime),
        getMap(leadTime),
        getAlerts()
      ])
      setSummary(sumRes)
      setMapData(mapRes)
      setAlerts(alertRes.alerts || [])
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(day)
  }, [day])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadData(day)
    } finally {
      setRefreshing(false)
    }
  }

  if (error) {
    return <ErrorState error={error} retry={() => loadData(day)} />
  }

  if (loading || !summary || !mapData) {
    return <LoadingState text="Loading WeatherGuard AI Operational Dashboard..." />
  }

  const sortedPoints = [...(mapData.points || [])].sort(
    (a, b) => (b.bust_probability || 0) - (a.bust_probability || 0)
  )
  const topRisks = sortedPoints.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="label text-cyan-700 dark:text-cyan-400 font-bold">OPERATIONS CENTER</span>
            <span className="rounded bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
              {summary.mode} MODE
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            NWP Forecast Reliability Dashboard
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Evaluating medium-range forecast skill for NOAA GFS 0.25° · Verified against ERA5 reanalysis truth
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-cyan-600' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Feed'}
          </button>
          <DaySelector day={day} onChange={setDay} />
        </div>
      </div>

      {/* Critical Operational Alert Banner */}
      {alerts.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50/90 p-4 shadow-sm dark:border-red-900/50 dark:bg-red-950/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-red-800 dark:text-red-300">
                  Critical Forecast Bust Alert ({alerts.length} Active Regions)
                </h4>
                <span className="text-[11px] text-red-700 dark:text-red-400 font-medium">Day {day} Synoptic Evaluation</span>
              </div>
              <p className="mt-1 text-xs text-red-700 dark:text-red-300 leading-relaxed">
                Elevated bust probability detected in {alerts.slice(0, 3).map(a => a.region).join(', ')}.
                Significant deviation expected between NWP precipitation and observational ground truth.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6 Key Performance Indicators */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPIcard
          label="Overall Confidence"
          value={`${summary.overall_confidence}%`}
          subtext={`${getConfidenceTier(summary.overall_confidence)} reliability tier`}
          risk={summary.overall_confidence < 50 ? 'up' : 'safe'}
          icon={ShieldAlert}
        />
        <KPIcard
          label="High-Risk Regions"
          value={summary.high_risk_regions}
          subtext={`${summary.high_risk_regions} of ${summary.total_regions} areas in danger`}
          risk="up"
          icon={AlertTriangle}
        />
        <KPIcard
          label="Bust Probability"
          value={`${Math.round(summary.bust_probability * 100)}%`}
          subtext="National spatial mean"
          risk={summary.bust_probability > 0.3 ? 'up' : 'safe'}
          icon={TrendingUp}
        />
        <KPIcard
          label="Lead Time"
          value={`Day ${day}`}
          subtext={`Forecast valid +${day * 24} hours`}
          icon={Clock}
        />
        <KPIcard
          label="NWP Model"
          value="GFS 0.25°"
          subtext="Operational 00Z Cycle"
          icon={Layers}
        />
        <KPIcard
          label="Data Freshness"
          value="Real-Time"
          subtext={summary.data_freshness || 'Synoptic Ingestion Active'}
          icon={Activity}
        />
      </div>

      {/* Main Grid: Interactive Map + High-Risk Analysis */}
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Left: India Confidence Map */}
        <section className="card p-0 overflow-hidden flex flex-col">
          <div className="border-b border-slate-100 p-4 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                India NWP Confidence Map
              </h2>
              <p className="text-xs text-slate-500">
                Spatial distribution of forecast reliability for Lead Day {day} across 48 subdivisions
              </p>
            </div>
            <Link
              to="/forecast-map"
              className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              Full Screen Map <ExternalLink size={13} />
            </Link>
          </div>

          <div className="p-3">
            <ConfidenceMap points={mapData.points} height="h-[460px]" />
          </div>
        </section>

        {/* Right: Regional Risk Ranking & Bust Histogram */}
        <div className="space-y-6 flex flex-col">
          {/* Top Bust Regions Ranking */}
          <section className="card">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Highest Bust Risk Subdivisions
                </h3>
                <p className="text-xs text-slate-500">Day {day} priority review list</p>
              </div>
              <Link
                to="/bust-analysis"
                className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {topRisks.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <Link
                      to={`/regions/${p.region_id || p.region.toLowerCase().replaceAll(' ', '-')}`}
                      className="font-semibold text-slate-800 dark:text-slate-200 hover:text-cyan-700 block"
                    >
                      {p.region}
                    </Link>
                    <span className="text-[11px] text-slate-500">
                      Conf: {p.confidence}% · Error: ±{p.expected_error} mm
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      {Math.round((p.bust_probability || 0) * 100)}%
                    </span>
                    <RiskBadge risk={p.risk} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Regional Bust Distribution Bar Chart */}
          <section className="card">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
              Regional Bust Probability Curve
            </h3>
            <p className="text-xs text-slate-500 mb-3">Top 12 subdivisions by risk index</p>
            <BustBars data={sortedPoints.slice(0, 12)} height={220} />
          </section>
        </div>
      </div>

      {/* Operational Warnings / Detailed Alert Grid */}
      <section className="card">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Active Meteorological Risk Advisory
            </h3>
            <p className="text-xs text-slate-500">Automated multi-factor risk detection</p>
          </div>
          <span className="text-xs font-medium text-slate-500">Updated: Just Now</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {alerts.slice(0, 6).map((a, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/50"
            >
              <div className="flex items-start justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">{a.region}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  a.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {a.severity}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
                {a.message}
              </p>
              <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-between text-[11px] text-slate-500">
                <span>Signal: Atmospheric Moisture / Pressure Drop</span>
                <Link
                  to={`/explainability?region=${a.region_id}&day=${day}`}
                  className="font-medium text-cyan-700 dark:text-cyan-400 hover:underline"
                >
                  Explain →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
