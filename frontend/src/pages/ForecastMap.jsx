import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Compass,
  Filter,
  ArrowRight,
  ShieldAlert,
  Droplets,
  Wind,
  Gauge,
  Activity,
  Maximize2
} from 'lucide-react'
import { getMap } from '../services/api'
import ConfidenceMap, { getConfidenceColor, getConfidenceTier } from '../components/ConfidenceMap'
import DaySelector from '../components/DaySelector'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import RiskBadge from '../components/RiskBadge'

export default function ForecastMap() {
  const [day, setDay] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [riskFilter, setRiskFilter] = useState('ALL')
  const [selectedRegion, setSelectedRegion] = useState(null)

  const loadMapData = async (leadTime = day) => {
    setError(null)
    setLoading(true)
    try {
      const res = await getMap(leadTime)
      setData(res)
      if (res.points && res.points.length > 0) {
        // Default selected to highest bust probability point
        const sorted = [...res.points].sort((a, b) => (b.bust_probability || 0) - (a.bust_probability || 0))
        setSelectedRegion(sorted[0])
      }
    } catch (err) {
      console.error('Failed to load map data:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMapData(day)
  }, [day])

  if (error) {
    return <ErrorState error={error} retry={() => loadMapData(day)} />
  }

  if (loading || !data) {
    return <LoadingState text="Loading India Geospatial Confidence Map..." />
  }

  const filteredPoints = (data.points || []).filter((p) => {
    if (riskFilter === 'ALL') return true
    if (riskFilter === 'HIGH_ONLY') return p.risk === 'HIGH' || p.risk === 'VERY_HIGH'
    if (riskFilter === 'MODERATE') return p.risk === 'MODERATE'
    if (riskFilter === 'SAFE') return p.risk === 'LOW' || p.risk === 'VERY_LOW'
    return true
  })

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="label text-cyan-700 dark:text-cyan-400 font-bold">GEOSPATIAL INTELLIGENCE</span>
            <span className="text-xs text-slate-400">· 48 Subdivisions Monitored</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            India NWP Confidence Map
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Interactive reliability and forecast bust assessment for Day {day} (valid +{day * 24}h)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Risk Filter Buttons */}
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setRiskFilter('ALL')}
              className={`rounded px-2.5 py-1 font-semibold ${
                riskFilter === 'ALL' ? 'bg-cyan-700 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              All ({data.points.length})
            </button>
            <button
              onClick={() => setRiskFilter('HIGH_ONLY')}
              className={`rounded px-2.5 py-1 font-semibold ${
                riskFilter === 'HIGH_ONLY' ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950'
              }`}
            >
              High Risk
            </button>
            <button
              onClick={() => setRiskFilter('SAFE')}
              className={`rounded px-2.5 py-1 font-semibold ${
                riskFilter === 'SAFE' ? 'bg-emerald-600 text-white' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'
              }`}
            >
              Safe
            </button>
          </div>

          <DaySelector day={day} onChange={setDay} />
        </div>
      </div>

      {/* Main Map + Inspection Panel Layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Interactive Leaflet Map */}
        <div className="card p-0 overflow-hidden shadow-md">
          <ConfidenceMap
            points={filteredPoints}
            selectedRegionId={selectedRegion ? selectedRegion.region_id : null}
            onSelectRegion={(point) => setSelectedRegion(point)}
            height="h-[620px]"
          />
        </div>

        {/* Detailed Region Inspector Panel */}
        <div className="space-y-4">
          {selectedRegion ? (
            <div className="card space-y-4">
              <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
                <span className="label text-cyan-700 dark:text-cyan-400 font-bold">Subdivision Diagnostics</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedRegion.region}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedRegion.latitude.toFixed(2)}°N, {selectedRegion.longitude.toFixed(2)}°E · Day {day} Forecast
                </p>
              </div>

              {/* Big KPI Cards */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                  <span className="text-[11px] font-semibold uppercase text-slate-500 block">Confidence Score</span>
                  <span
                    className="text-2xl font-extrabold mt-1 block"
                    style={{ color: getConfidenceColor(selectedRegion.confidence) }}
                  >
                    {selectedRegion.confidence}%
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {getConfidenceTier(selectedRegion.confidence)} Tier
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                  <span className="text-[11px] font-semibold uppercase text-slate-500 block">Bust Probability</span>
                  <span className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 mt-1 block">
                    {Math.round((selectedRegion.bust_probability || 0) * 100)}%
                  </span>
                  <span className="text-[10px]">
                    <RiskBadge risk={selectedRegion.risk} />
                  </span>
                </div>
              </div>

              {/* Meteorological Diagnostics */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Atmospheric Indicators
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                    <Droplets size={16} className="text-cyan-600" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Relative Humidity</span>
                      <span className="font-bold">{selectedRegion.relative_humidity}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                    <Gauge size={16} className="text-indigo-600" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">MSL Pressure</span>
                      <span className="font-bold">{selectedRegion.pressure_msl} hPa</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                    <Wind size={16} className="text-emerald-600" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Wind Velocity</span>
                      <span className="font-bold">{selectedRegion.wind_speed} m/s</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                    <Activity size={16} className="text-red-500" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Expected Error</span>
                      <span className="font-bold">±{selectedRegion.expected_error} mm/°C</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meteorological Low Confidence Reasons */}
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs dark:border-amber-900/40 dark:bg-amber-950/20">
                <span className="font-bold text-amber-900 dark:text-amber-300 block mb-1">
                  Why Confidence is {getConfidenceTier(selectedRegion.confidence)}:
                </span>
                <ul className="space-y-1 text-amber-800 dark:text-amber-300/80 text-[11px] list-disc list-inside">
                  <li>Rapid MSL pressure gradient fluctuation</li>
                  <li>Deep atmospheric moisture convergence (RH &gt; {selectedRegion.relative_humidity}%)</li>
                  <li>High historical forecast error under {selectedRegion.synoptic_regime?.replaceAll('_', ' ')}</li>
                  <li>Moderate-to-high vertical wind shear in boundary layer</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to={`/regions/${selectedRegion.region_id || selectedRegion.region.toLowerCase().replaceAll(' ', '-')}`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-700 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-cyan-800 transition-all"
                >
                  Open 10-Day Region Analysis <ArrowRight size={14} />
                </Link>
                <Link
                  to={`/explainability?region=${selectedRegion.region_id}&day=${day}`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Explain with TreeSHAP
                </Link>
              </div>
            </div>
          ) : (
            <div className="card text-center p-8 text-slate-500 text-xs">
              Click any point on the India map to inspect meteorological confidence details.
            </div>
          )}

          {/* Quick Info Box */}
          <div className="card text-xs text-slate-500 leading-relaxed space-y-1.5">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">5-Tier Confidence Scoring</span>
            <p>
              Calculated using our multi-penalty meteorological reliability engine. Points are evaluated against
              synoptic pressure dynamics, moisture depth, and historical error distributions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
