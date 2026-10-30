import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin,
  Search,
  ArrowUpDown,
  Filter,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react'
import { getMap, getRegions } from '../services/api'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import RiskBadge from '../components/RiskBadge'
import { getConfidenceColor, getConfidenceTier } from '../components/ConfidenceMap'

export default function Regions() {
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('bust_desc') // 'bust_desc', 'conf_asc', 'name_asc', 'error_desc'
  const [zoneFilter, setZoneFilter] = useState('ALL')

  const loadData = async () => {
    setError(null)
    setLoading(true)
    try {
      // Load Day 5 to give a realistic medium-range risk ranking
      const res = await getMap(5)
      setPoints(res.points || [])
    } catch (err) {
      console.error('Failed to load regions:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (error) {
    return <ErrorState error={error} retry={loadData} />
  }

  if (loading) {
    return <LoadingState text="Loading 48 Indian Meteorological Subdivisions..." />
  }

  // Filter & Search
  const filtered = points.filter((p) => {
    const matchesSearch =
      p.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.synoptic_regime && p.synoptic_regime.toLowerCase().includes(searchQuery.toLowerCase()))
    
    if (zoneFilter === 'ALL') return matchesSearch
    return matchesSearch && p.zone === zoneFilter
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'bust_desc') return (b.bust_probability || 0) - (a.bust_probability || 0)
    if (sortBy === 'conf_asc') return (a.confidence || 0) - (b.confidence || 0)
    if (sortBy === 'error_desc') return (b.expected_error || 0) - (a.expected_error || 0)
    if (sortBy === 'name_asc') return a.region.localeCompare(b.region)
    return 0
  })

  const zones = ['ALL', 'NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL', 'NORTHEAST']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="label text-cyan-700 dark:text-cyan-400 font-bold">SPATIAL SUBDIVISIONS</span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Monitored Regions &amp; Risk Ranking
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Dynamically prioritized by forecast bust probability and expected error at Day 5 medium-range lead time
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search region or regime..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-xs shadow-sm focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Zone chips */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="text-slate-400 text-xs font-semibold py-1 mr-1 hidden sm:inline">Zone:</span>
          {zones.map((z) => (
            <button
              key={z}
              onClick={() => setZoneFilter(z)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                zoneFilter === z
                  ? 'bg-cyan-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {z}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <ArrowUpDown size={14} className="text-slate-400" />
          <span className="text-slate-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="bust_desc">Bust Probability (High → Low)</option>
            <option value="conf_asc">Confidence (Low → High)</option>
            <option value="error_desc">Expected Error (High → Low)</option>
            <option value="name_asc">Region Name (A → Z)</option>
          </select>
        </div>
      </div>

      {/* Grid of Regions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sorted.map((r) => {
          const confColor = getConfidenceColor(r.confidence)
          return (
            <Link
              key={r.id}
              to={`/regions/${r.region_id || r.region.toLowerCase().replaceAll(' ', '-')}`}
              className="card group hover:border-cyan-500 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={15} className="text-cyan-700 dark:text-cyan-400 shrink-0" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-400">
                      {r.region}
                    </h3>
                  </div>
                  <RiskBadge risk={r.risk} />
                </div>

                <p className="mt-1 text-[11px] text-slate-400">
                  {r.latitude.toFixed(2)}°N, {r.longitude.toFixed(2)}°E · {r.zone || 'INDIA'}
                </p>

                {/* Score Pills */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                    <span className="text-[10px] text-slate-500 block">Confidence</span>
                    <span className="font-extrabold text-base" style={{ color: confColor }}>
                      {r.confidence}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {getConfidenceTier(r.confidence)}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
                    <span className="text-[10px] text-slate-500 block">Bust Risk</span>
                    <span className="font-extrabold text-base text-orange-600 dark:text-orange-400">
                      {Math.round((r.bust_probability || 0) * 100)}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      ±{r.expected_error} mm/°C
                    </span>
                  </div>
                </div>

                {r.synoptic_regime && (
                  <div className="mt-3 text-[11px] text-slate-500 truncate">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Regime:</span>{' '}
                    {r.synoptic_regime.replaceAll('_', ' ')}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                <span>10-Day Deep Dive</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )
        })}
      </div>

      {sorted.length === 0 && (
        <div className="card text-center p-12 text-sm text-slate-500">
          No regions matched your search criteria. Try a different query or zone filter.
        </div>
      )}
    </div>
  )
}
