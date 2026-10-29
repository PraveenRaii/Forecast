import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  BrainCircuit,
  Info,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Layers
} from 'lucide-react'
import { getExplain, getRegions } from '../services/api'
import { FeatureImportanceChart } from '../components/Charts'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import RiskBadge from '../components/RiskBadge'
import DaySelector from '../components/DaySelector'
import { getConfidenceColor, getConfidenceTier } from '../components/ConfidenceMap'

export default function Explainability() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialRegion = searchParams.get('region') || 'coastal-andhra-pradesh'
  const initialDay = parseInt(searchParams.get('day') || '5', 10)

  const [regionId, setRegionId] = useState(initialRegion)
  const [leadTime, setLeadTime] = useState(initialDay)
  const [regionsList, setRegionsList] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getRegions()
      .then((res) => setRegionsList(res.data || []))
      .catch((err) => console.error('Failed to load regions list:', err))
  }, [])

  const loadExplanation = async (rId = regionId, lTime = leadTime) => {
    setError(null)
    setLoading(true)
    try {
      const res = await getExplain(rId, lTime)
      setData(res)
    } catch (err) {
      console.error('Failed to load explanation:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExplanation(regionId, leadTime)
    setSearchParams({ region: regionId, day: leadTime.toString() })
  }, [regionId, leadTime])

  if (error) {
    return <ErrorState error={error} retry={() => loadExplanation(regionId, leadTime)} />
  }

  if (loading || !data) {
    return <LoadingState text="Computing Native TreeSHAP Feature Attributions..." />
  }

  const factors = data.top_factors || []
  const confColor = getConfidenceColor(data.confidence)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="label text-cyan-700 dark:text-cyan-400 font-bold">EXPLAINABLE AI ENGINE</span>
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              TreeSHAP ATTRIBUTION
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Why is forecast confidence low?
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Exact Shapley Additive Explanations (SHAP) decomposing individual meteorological drivers of forecast uncertainty
          </p>
        </div>

        {/* Region & Lead Time Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={regionId}
            onChange={(e) => setRegionId(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {regionsList.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <DaySelector day={leadTime} onChange={setLeadTime} />
        </div>
      </div>

      {/* Decision Summary Card */}
      <div className="card border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Model Evaluation for:
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {data.region} · Day {data.lead_time} Lead Time
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Active Regime: <span className="font-semibold text-slate-700 dark:text-slate-300">{data.synoptic_regime?.replaceAll('_', ' ')}</span> · Methodology: {data.methodology}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/60">
              <span className="text-[11px] text-slate-500 block uppercase font-semibold">Reliability Score</span>
              <span className="text-3xl font-extrabold" style={{ color: confColor }}>
                {data.confidence}%
              </span>
              <span className="text-[10px] text-slate-400 block">{getConfidenceTier(data.confidence)}</span>
            </div>

            <div className="text-center rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/60">
              <span className="text-[11px] text-slate-500 block uppercase font-semibold">Bust Probability</span>
              <span className="text-3xl font-extrabold text-orange-600 dark:text-orange-400">
                {Math.round((data.bust_probability || 0) * 100)}%
              </span>
              <span className="text-[10px]"><RiskBadge risk={data.risk_level} /></span>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Bar Chart: SHAP Feature Contributions */}
      <section className="card">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Primary Uncertainty Drivers (TreeSHAP Relative Weights)
            </h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-red-500" />
                <span className="text-slate-600 dark:text-slate-300">Increases Bust Risk (+)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-300">Stabilizes Forecast (-)</span>
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Each bar measures the marginal Shapley contribution of the feature in pushing the forecast toward a bust.
          </p>
        </div>

        <FeatureImportanceChart factors={factors} height={320} />
      </section>

      {/* Granular Feature Impact Cards */}
      <section className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Detailed Feature Decomposition &amp; Meteorological Impact
        </h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {factors.map((f, idx) => {
            const isNegative = f.direction === 'increases_bust'
            return (
              <div
                key={f.name}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    #{idx + 1} {f.name}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      isNegative
                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {isNegative ? 'Elevates Risk' : 'Stabilizing'}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-xs text-slate-500">Relative Weight:</span>
                  <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                    {(f.impact * 100).toFixed(1)}%
                  </span>
                </div>

                <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {f.description ||
                    (isNegative
                      ? 'Elevated value in this meteorological parameter destabilizes numerical simulation skill.'
                      : 'Observed value is within climatological steady envelope, providing forecast anchor.')}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Scientific Note Banner */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 leading-relaxed">
        <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
          Scientific Transparency &amp; Methodology:
        </span>
        <p>{data.scientific_note}</p>
      </div>
    </div>
  )
}
