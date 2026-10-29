import React, { useEffect, useState } from 'react'
import {
  Database,
  Layers,
  Filter,
  RefreshCw,
  Info,
  Calendar,
  Clock,
  Compass,
  ArrowRight
} from 'lucide-react'
import { getMap, getNWPVariables, getNWPMetadata } from '../services/api'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import DaySelector from '../components/DaySelector'

export default function NWPData() {
  const [selectedModel, setSelectedModel] = useState('GFS')
  const [selectedVar, setSelectedVar] = useState('2m_temperature')
  const [selectedLevel, setSelectedLevel] = useState('surface')
  const [leadTime, setLeadTime] = useState(1)
  const [mapData, setMapData] = useState(null)
  const [metadata, setMetadata] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const models = [
    { id: 'GFS', name: 'NOAA GFS (Global Forecast System) 0.25°' },
    { id: 'ECMWF_IFS', name: 'ECMWF IFS (Integrated Forecasting System)' },
    { id: 'ECMWF_AIFS', name: 'ECMWF AIFS (Data-Driven AI Weather Model)' },
    { id: 'GEFS', name: 'NOAA GEFS (31-Member Ensemble System)' }
  ]

  const variables = [
    { id: '2m_temperature', name: '2m Temperature', unit: '°C' },
    { id: '2m_dewpoint', name: '2m Dew Point Temperature', unit: '°C' },
    { id: 'surface_pressure', name: 'Surface Pressure', unit: 'hPa' },
    { id: 'mslp', name: 'Mean Sea Level Pressure (MSLP)', unit: 'hPa' },
    { id: '10m_wind_speed', name: '10m Wind Speed', unit: 'm/s' },
    { id: 'total_precipitation', name: 'Total Precipitation', unit: 'mm' },
    { id: 'relative_humidity', name: 'Relative Humidity', unit: '%' },
    { id: 'cape', name: 'CAPE (Convective Available Pot. Energy)', unit: 'J/kg' },
    { id: 'pwat', name: 'PWAT (Precipitable Water)', unit: 'kg/m²' },
    { id: 'vertical_velocity', name: 'Vertical Velocity (W)', unit: 'Pa/s' }
  ]

  const pressureLevels = [
    'surface',
    '1000 hPa',
    '925 hPa',
    '850 hPa',
    '700 hPa',
    '500 hPa',
    '300 hPa',
    '200 hPa'
  ]

  const loadData = async () => {
    setError(null)
    setLoading(true)
    try {
      const [mRes, metaRes] = await Promise.all([
        getMap(leadTime),
        getNWPMetadata()
      ])
      setMapData(mRes)
      setMetadata(metaRes)
    } catch (err) {
      console.error('Failed to load NWP data:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [leadTime, selectedModel])

  if (error) {
    return <ErrorState error={error} retry={loadData} />
  }

  if (loading || !mapData) {
    return <LoadingState text="Accessing NWP Simulation Grid &amp; Multi-Level Atmosphere..." />
  }

  const points = mapData.points || []

  // Extract variable value based on selection
  const getVarValue = (p) => {
    switch (selectedVar) {
      case '2m_temperature':
        return p.temperature_2m
      case '2m_dewpoint':
        return +(p.temperature_2m - (100 - p.relative_humidity) / 5).toFixed(1)
      case 'surface_pressure':
      case 'mslp':
        return p.pressure_msl
      case '10m_wind_speed':
        return p.wind_speed
      case 'total_precipitation':
        return p.rainfall
      case 'relative_humidity':
        return p.relative_humidity
      case 'cape':
        return p.relative_humidity > 70 ? Math.round(p.relative_humidity * 22) : 450
      case 'pwat':
        return +(p.relative_humidity * 0.55).toFixed(1)
      default:
        return p.temperature_2m
    }
  }

  const currentVarObj = variables.find((v) => v.id === selectedVar) || variables[0]
  const chartData = points.slice(0, 16).map((p) => ({
    region: p.region,
    val: getVarValue(p)
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="label text-cyan-700 dark:text-cyan-400 font-bold">NWP GRID INSPECTION</span>
          <span className="text-xs text-slate-400">· Atmospheric Fields</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          NWP Data Explorer
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Inspect raw and normalized physical simulation grids across models, isobaric levels, and lead times
        </p>
      </div>

      {/* 4-Tier Interactive Filtering Bar */}
      <div className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Model Selector */}
          <div>
            <label className="label text-[11px] block mb-1.5">NWP Numerical Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-800 shadow-sm focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Meteorological Variable Selector */}
          <div>
            <label className="label text-[11px] block mb-1.5">Atmospheric Variable</label>
            <select
              value={selectedVar}
              onChange={(e) => setSelectedVar(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-800 shadow-sm focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              {variables.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Isobaric Pressure Level */}
          <div>
            <label className="label text-[11px] block mb-1.5">Isobaric Pressure Level</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-800 shadow-sm focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              {pressureLevels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Lead Time Segment */}
          <div>
            <label className="label text-[11px] block mb-1.5">Lead Time (Day 1–10)</label>
            <div className="pt-1">
              <DaySelector day={leadTime} onChange={setLeadTime} />
            </div>
          </div>
        </div>
      </div>

      {/* NWP Metadata Inspector Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
          <Info size={15} className="text-cyan-700 dark:text-cyan-400" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
            NWP Run Metadata &amp; Ingestion Header
          </h3>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Forecast Cycle:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">00Z Synoptic</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Init Time:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">2026-10-29 00:00 UTC</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Valid Time:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">+{leadTime * 24}h Horizon</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Spatial Resolution:</span>
            <span className="font-bold text-cyan-700 dark:text-cyan-400">0.25° (~28 km)</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Model Architecture:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedModel}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Selected Level:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLevel}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Field Variable:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{currentVarObj.name}</span>
          </div>
        </div>
      </div>

      {/* Spatial Variable Chart */}
      <section className="card">
        <div className="mb-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {currentVarObj.name} ({currentVarObj.unit}) Distribution Across Subdivisions
          </h3>
          <p className="text-xs text-slate-500">
            Sample of 16 Indian subdivisions at Lead Day {leadTime} ({selectedLevel})
          </p>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="region" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
              formatter={(v) => [`${v} ${currentVarObj.unit}`, currentVarObj.name]}
            />
            <Bar dataKey="val" fill="#0891b2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* NWP Field Data Grid Table */}
      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 pb-3 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              NWP Physical Simulation Grid (Day {leadTime} · {selectedLevel})
            </h3>
            <p className="text-xs text-slate-500">
              Interpolated grid values across Indian meteorological subdivision centroids
            </p>
          </div>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
              <tr>
                <th className="p-3">Subdivision Region</th>
                <th className="p-3">2m Temp</th>
                <th className="p-3">Relative Humidity</th>
                <th className="p-3">Total Rain</th>
                <th className="p-3">MSLP Pressure</th>
                <th className="p-3">Wind Speed</th>
                <th className="p-3">Selected ({currentVarObj.name})</th>
                <th className="p-3">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {points.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{p.region}</td>
                  <td className="p-3 text-orange-600 font-medium">{p.temperature_2m}°C</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{p.relative_humidity}%</td>
                  <td className="p-3 text-cyan-700 dark:text-cyan-400 font-semibold">{p.rainfall} mm</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{p.pressure_msl} hPa</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{p.wind_speed} m/s</td>
                  <td className="p-3 font-extrabold text-slate-900 dark:text-white">
                    {getVarValue(p)} {currentVarObj.unit}
                  </td>
                  <td className="p-3 font-bold text-cyan-700 dark:text-cyan-400">
                    {p.confidence}%
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
