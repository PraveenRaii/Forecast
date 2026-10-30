import React, { useEffect, useState } from 'react'
import {
  Settings2,
  Save,
  CheckCircle2,
  AlertCircle,
  Database,
  Moon,
  Sun,
  Shield,
  Layers
} from 'lucide-react'
import { getSettings, updateSettings } from '../services/api'
import { useTheme } from '../context/ThemeContext'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'

export default function Settings() {
  const { dark, setDark } = useTheme()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getSettings()
      .then((res) => {
        setConfig(res)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load settings:', err)
        setError(err)
        setLoading(false)
      })
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess(null)
    setError(null)
    try {
      await updateSettings(config)
      setSaveSuccess('Settings saved and persisted to database successfully.')
      setTimeout(() => setSaveSuccess(null), 4000)
    } catch (err) {
      console.error('Failed to save settings:', err)
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  if (error && !config) {
    return <ErrorState error={error} retry={() => window.location.reload()} />
  }

  if (loading || !config) {
    return <LoadingState text="Loading WeatherGuard AI Operational Configuration..." />
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <span className="label text-cyan-700 dark:text-cyan-400 font-bold">SYSTEM PREFERENCES</span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Platform Settings
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Configure model thresholds, forecast bust percentiles, default providers, and visualization themes
        </p>
      </div>

      {saveSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          {saveSuccess}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: NWP & Forecast Thresholds */}
        <section className="card space-y-4">
          <h2 className="font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 pb-2 dark:border-slate-800">
            NWP Engine &amp; Thresholds
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Default Model */}
            <div>
              <label className="label text-[11px] block mb-1">Default NWP Model</label>
              <select
                value={config.default_nwp_model || 'GFS'}
                onChange={(e) => setConfig({ ...config, default_nwp_model: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-800 shadow-sm focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="GFS">NOAA GFS (0.25° Global)</option>
                <option value="ECMWF_IFS">ECMWF IFS (Integrated Forecasting)</option>
                <option value="ECMWF_AIFS">ECMWF AIFS (AI Weather Model)</option>
                <option value="GEFS">NOAA GEFS (31-Member Ensemble)</option>
              </select>
            </div>

            {/* Default Lead Time */}
            <div>
              <label className="label text-[11px] block mb-1">Default Operational Lead Time</label>
              <select
                value={config.default_lead_time || 1}
                onChange={(e) => setConfig({ ...config, default_lead_time: parseInt(e.target.value, 10) })}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-800 shadow-sm focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Day {i + 1} (+{ (i + 1) * 24 }h)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            {/* Confidence Threshold */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label text-[11px]">Low Confidence Alert Threshold</label>
                <span className="font-bold text-xs text-cyan-700 dark:text-cyan-400">
                  {config.confidence_threshold || 50}%
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="80"
                step="5"
                value={config.confidence_threshold || 50}
                onChange={(e) => setConfig({ ...config, confidence_threshold: parseInt(e.target.value, 10) })}
                className="w-full accent-cyan-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Subdivisions with confidence score below this percentage trigger operational alerts.
              </p>
            </div>

            {/* Bust Percentile Threshold */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label text-[11px]">Forecast Bust Percentile Cutoff</label>
                <span className="font-bold text-xs text-red-600 dark:text-red-400">
                  P{config.bust_percentile || 90}
                </span>
              </div>
              <select
                value={config.bust_percentile || 90}
                onChange={(e) => setConfig({ ...config, bust_percentile: parseInt(e.target.value, 10) })}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-800 shadow-sm focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value={85}>85th Percentile (Sensitive Bust Alert)</option>
                <option value={90}>90th Percentile (Standard Meteorological Baseline)</option>
                <option value={95}>95th Percentile (Severe Extreme Bust Only)</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Historical error percentile threshold above which a forecast is classified as a bust.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Data Mode & Environment */}
        <section className="card space-y-4">
          <h2 className="font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 pb-2 dark:border-slate-800">
            Data Mode &amp; Ingestion Environment
          </h2>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
            <div>
              <span className="font-bold text-xs text-slate-900 dark:text-white block">
                Operational Data Mode
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Switch between zero-dependency synthetic synoptic physics (demo) and live NOMADS/ECMWF providers.
              </p>
            </div>

            <div className="flex rounded-lg border border-slate-300 bg-white p-1 text-xs dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setConfig({ ...config, data_mode: 'demo' })}
                className={`rounded px-3 py-1 font-semibold ${
                  config.data_mode === 'demo' ? 'bg-cyan-700 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Demo Mode
              </button>
              <button
                type="button"
                onClick={() => setConfig({ ...config, data_mode: 'live' })}
                className={`rounded px-3 py-1 font-semibold ${
                  config.data_mode === 'live' ? 'bg-cyan-700 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Live NWP
              </button>
            </div>
          </div>
        </section>

        {/* Section 3: Appearance & UI Preferences */}
        <section className="card space-y-4">
          <h2 className="font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 pb-2 dark:border-slate-800">
            Appearance &amp; User Interface
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-slate-900 dark:text-white block">
                Theme Mode
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Toggle between dark command center mode and crisp day mode.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setDark(!dark)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {dark ? <Sun size={15} className="text-amber-500" /> : <Moon size={15} className="text-cyan-700" />}
              {dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </button>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-cyan-800 transition-all disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? 'Persisting Settings...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  )
}
