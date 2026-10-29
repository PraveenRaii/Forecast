import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers
} from 'lucide-react'
import { getMap, getSummary } from '../services/api'
import { ConfidenceTrend, BustBars } from '../components/Charts'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import RiskBadge from '../components/RiskBadge'
import { getConfidenceColor, getConfidenceTier } from '../components/ConfidenceMap'

export default function DayForecastView() {
  const [activeDay, setActiveDay] = useState(1)
  const [daySummaries, setDaySummaries] = useState([])
  const [currentDayData, setCurrentDayData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadAllDays = async () => {
    setError(null)
    setLoading(true)
    try {
      // Fetch summaries across all 10 lead days
      const days = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const results = await Promise.all(days.map((d) => getSummary(d)))
      const formatted = results.map((res, idx) => ({
        lead_time: idx + 1,
        confidence: res.overall_confidence,
        bust_probability: res.bust_probability,
        high_risk_regions: res.high_risk_regions,
        expected_error: (1.5 + idx * 0.95).toFixed(1), // Average error scaling
        risk: idx < 2 ? 'VERY_LOW' : idx < 4 ? 'LOW' : idx < 7 ? 'MODERATE' : idx < 9 ? 'HIGH' : 'VERY_HIGH'
      }))
      setDaySummaries(formatted)

      // Fetch points for current active day
      const mapRes = await getMap(activeDay)
      setCurrentDayData(mapRes)
    } catch (err) {
      console.error('Failed to load day forecast:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllDays()
  }, [])

  useEffect(() => {
    // When activeDay changes, fetch that day's points
    const loadDayPoints = async () => {
      try {
        const res = await getMap(activeDay)
        setCurrentDayData(res)
      } catch (err) {
        console.error('Failed to load active day points:', err)
      }
    }
    loadDayPoints()
  }, [activeDay])

  if (error) {
    return <ErrorState error={error} retry={loadAllDays} />
  }

  if (loading || !currentDayData) {
    return <LoadingState text="Loading 10-Day Medium-Range Predictability Curves..." />
  }

  const activeSummary = daySummaries.find((d) => d.lead_time === activeDay) || daySummaries[0] || {}
  const points = currentDayData.points || []
  const sortedPoints = [...points].sort((a, b) => (b.bust_probability || 0) - (a.bust_probability || 0))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="label text-cyan-700 dark:text-cyan-400 font-bold">TEMPORAL PREDICTABILITY</span>
          <span className="text-xs text-slate-400">· 10-Day Horizon</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Day 1 – Day 10 Forecast Horizon
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Track the progressive decay of NWP simulation skill and escalating forecast-bust probability over 240 hours
        </p>
      </div>

      {/* 10-Day Horizontal Segment Cards (Day 1 to 10) */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-10">
        {daySummaries.map((d) => {
          const isSelected = activeDay === d.lead_time
          const confColor = getConfidenceColor(d.confidence)
          return (
            <button
              key={d.lead_time}
              onClick={() => setActiveDay(d.lead_time)}
              className={`rounded-xl border p-3 text-left transition-all ${
                isSelected
                  ? 'border-cyan-600 bg-cyan-50/80 shadow-md ring-2 ring-cyan-500/20 dark:border-cyan-500 dark:bg-cyan-950/40'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Day {d.lead_time}</span>
                <span className="text-[10px] text-slate-400">+{d.lead_time * 24}h</span>
              </div>

              <div className="mt-2">
                <span className="text-[10px] text-slate-500 block">Confidence</span>
                <span className="text-base font-extrabold" style={{ color: confColor }}>
                  {d.confidence}%
                </span>
              </div>

              <div className="mt-1 text-[11px]">
                <span className="text-slate-400 block text-[10px]">Bust Risk:</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {Math.round((d.bust_probability || 0) * 100)}%
                </span>
              </div>

              <div className="mt-2">
                <RiskBadge risk={d.risk} />
              </div>
            </button>
          )
        })}
      </div>

      {/* Active Day Highlight Section */}
      <div className="card bg-gradient-to-r from-slate-900 to-slate-950 text-white p-6 shadow-lg border-slate-800">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Operational Focus: Lead Time Day {activeDay} (+{activeDay * 24} Hours)
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-1">
              National Reliability: {activeSummary.confidence}% ({getConfidenceTier(activeSummary.confidence)} Tier)
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              Historical error baseline: ±{activeSummary.expected_error} mm / °C ·{' '}
              {activeSummary.high_risk_regions} Indian subdivisions exceed bust threshold
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/forecast-map"
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
            >
              Inspect Map at Day {activeDay} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* 10-Day Predictability Curves */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <div className="mb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Forecast Confidence Decay (Day 1 → Day 10)
            </h3>
            <p className="text-xs text-slate-500">
              Predictability decay from 90%+ down to &lt;30% as non-linear error growth dominates
            </p>
          </div>
          <ConfidenceTrend data={daySummaries} height={250} />
        </section>

        <section className="card">
          <div className="mb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Forecast Bust Probability Growth
            </h3>
            <p className="text-xs text-slate-500">
              Escalating chance of catastrophic forecast bust with extended lead time
            </p>
          </div>
          <BustBars
            data={daySummaries.map((d) => ({
              region: `Day ${d.lead_time}`,
              bust_probability: d.bust_probability
            }))}
            height={250}
          />
        </section>
      </div>

      {/* Active Day Subdivision Table */}
      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 pb-3 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Day {activeDay} Regional Forecast Reliability Ranks
            </h3>
            <p className="text-xs text-slate-500">
              Subdivisions sorted by forecast bust vulnerability for valid time +{activeDay * 24} hours
            </p>
          </div>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
              <tr>
                <th className="p-3">Region</th>
                <th className="p-3">Lead Time</th>
                <th className="p-3">Confidence</th>
                <th className="p-3">Bust Probability</th>
                <th className="p-3">Expected Error</th>
                <th className="p-3">Relative Humidity</th>
                <th className="p-3">MSLP</th>
                <th className="p-3">Risk Tier</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedPoints.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{p.region}</td>
                  <td className="p-3 text-slate-500">Day {p.lead_time}</td>
                  <td className="p-3 font-bold" style={{ color: getConfidenceColor(p.confidence) }}>
                    {p.confidence}%
                  </td>
                  <td className="p-3 font-extrabold text-orange-600 dark:text-orange-400">
                    {Math.round((p.bust_probability || 0) * 100)}%
                  </td>
                  <td className="p-3 text-slate-700 dark:text-slate-300">±{p.expected_error} mm/°C</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{p.relative_humidity}%</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{p.pressure_msl} hPa</td>
                  <td className="p-3">
                    <RiskBadge risk={p.risk} />
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      to={`/regions/${p.region_id || p.region.toLowerCase().replaceAll(' ', '-')}`}
                      className="font-bold text-cyan-700 dark:text-cyan-400 hover:underline"
                    >
                      Inspect →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
