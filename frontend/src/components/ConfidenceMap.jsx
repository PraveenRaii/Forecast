import React, { useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Shield, Zap, Wind, Droplets, Layers } from 'lucide-react'
import RiskBadge from './RiskBadge'

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

const MAP_LAYERS = {
  google_roadmap: {
    label: 'Google Map',
    url: GOOGLE_MAPS_KEY
      ? `https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_KEY}`
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    subdomains: GOOGLE_MAPS_KEY ? ['0', '1', '2', '3'] : ['a', 'b', 'c', 'd'],
    attribution: GOOGLE_MAPS_KEY
      ? '&copy; <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer">Google Maps</a>'
      : '&copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 20
  },
  google_hybrid: {
    label: 'Satellite',
    url: GOOGLE_MAPS_KEY
      ? `https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_KEY}`
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    subdomains: GOOGLE_MAPS_KEY ? ['0', '1', '2', '3'] : ['a', 'b', 'c', 'd'],
    attribution: GOOGLE_MAPS_KEY
      ? '&copy; <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer">Google Maps</a>'
      : '&copy; Esri',
    maxZoom: 20
  },
  google_terrain: {
    label: 'Terrain',
    url: GOOGLE_MAPS_KEY
      ? `https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_KEY}`
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    subdomains: GOOGLE_MAPS_KEY ? ['0', '1', '2', '3'] : ['a', 'b', 'c', 'd'],
    attribution: GOOGLE_MAPS_KEY
      ? '&copy; <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer">Google Maps</a>'
      : '&copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 20
  },
  carto_voyager: {
    label: 'Clean',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19
  }
}

// 5-Tier Scientific Confidence Classification
export const getConfidenceColor = (score) => {
  if (score >= 80) return '#10b981' // Very High Confidence (Emerald)
  if (score >= 65) return '#06b6d4' // High Confidence (Cyan)
  if (score >= 50) return '#eab308' // Moderate Confidence (Amber)
  if (score >= 35) return '#f97316' // Low Confidence (Orange)
  return '#ef4444'                  // Very Low Confidence (Crimson)
}

export const getConfidenceTier = (score) => {
  if (score >= 80) return 'Very High'
  if (score >= 65) return 'High'
  if (score >= 50) return 'Moderate'
  if (score >= 35) return 'Low'
  return 'Very Low'
}

export default function ConfidenceMap({ points = [], selectedRegionId = null, onSelectRegion = null, height = 'h-[500px]' }) {
  const [activePoint, setActivePoint] = useState(null)
  const [activeLayer, setActiveLayer] = useState(GOOGLE_MAPS_KEY ? 'google_roadmap' : 'carto_voyager')

  const currentLayer = MAP_LAYERS[activeLayer] || MAP_LAYERS.google_roadmap

  const handlePointClick = (p) => {
    setActivePoint(p)
    if (onSelectRegion) onSelectRegion(p)
  }

  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Map Container */}
      <div className={`${height} w-full relative z-0`}>
        {/* Layer Selector Floating Toolbar */}
        <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white/95 p-1 shadow-md backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          <div className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <Layers size={12} className="text-cyan-700 dark:text-cyan-400" />
            <span>Map</span>
          </div>
          {Object.entries(MAP_LAYERS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveLayer(key)}
              className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-all ${
                activeLayer === key
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {config.label}
            </button>
          ))}
          {GOOGLE_MAPS_KEY && (
            <span className="ml-1 inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Google
            </span>
          )}
        </div>

        <MapContainer
          center={[22.8, 81.5]}
          zoom={4.6}
          minZoom={4}
          maxZoom={18}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            key={activeLayer}
            attribution={currentLayer.attribution}
            url={currentLayer.url}
            subdomains={currentLayer.subdomains}
            maxZoom={currentLayer.maxZoom}
          />

          {points.map((p) => {
            const conf = p.confidence ?? 60
            const color = getConfidenceColor(conf)
            const isSelected = selectedRegionId === p.region_id || (activePoint && activePoint.id === p.id)

            return (
              <CircleMarker
                key={p.id || `${p.region_id}-${p.lead_time}`}
                center={[p.latitude, p.longitude]}
                radius={isSelected ? 10 : 7.5}
                pathOptions={{
                  color: isSelected ? '#1e293b' : color,
                  weight: isSelected ? 3 : 1.5,
                  fillColor: color,
                  fillOpacity: isSelected ? 0.95 : 0.78
                }}
                eventHandlers={{
                  click: () => handlePointClick(p)
                }}
              >
                <Popup className="custom-popup">
                  <div className="min-w-[210px] p-1 text-slate-800">
                    <div className="flex items-center justify-between border-b pb-1.5">
                      <span className="font-bold text-sm text-slate-900">{p.region}</span>
                      <RiskBadge risk={p.risk} />
                    </div>

                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Day {p.lead_time} Confidence:</span>
                        <span className="font-semibold" style={{ color }}>
                          {p.confidence}% ({getConfidenceTier(p.confidence)})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Bust Probability:</span>
                        <span className="font-semibold text-orange-600">
                          {Math.round((p.bust_probability || 0) * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Expected Error:</span>
                        <span className="font-medium text-slate-700">
                          ±{p.expected_error} mm / °C
                        </span>
                      </div>
                      {p.synoptic_regime && (
                        <div className="pt-1 text-[11px] text-slate-500 italic">
                          Regime: {p.synoptic_regime.replaceAll('_', ' ')}
                        </div>
                      )}
                    </div>

                    {/* Meteorological Risk Factors */}
                    <div className="mt-2.5 rounded bg-slate-50 p-1.5 text-[11px] text-slate-600 border border-slate-100">
                      <span className="font-medium block text-slate-700 mb-0.5">Atmospheric Signals:</span>
                      <div className="space-y-0.5">
                        <div>• RH: {p.relative_humidity}% | MSLP: {p.pressure_msl} hPa</div>
                        <div>• Wind: {p.wind_speed} m/s | Rain: {p.rainfall} mm</div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-1 border-t border-slate-100">
                      <Link
                        to={`/regions/${p.region_id || p.region.toLowerCase().replaceAll(' ', '-')}`}
                        className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 flex items-center gap-1"
                      >
                        Deep Dive <ArrowRight size={13} />
                      </Link>
                      <Link
                        to={`/explainability?region=${p.region_id}&day=${p.lead_time}`}
                        className="text-[11px] font-medium text-slate-500 hover:text-cyan-700"
                      >
                        Explain (SHAP)
                      </Link>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>

        {/* 5-Tier Scientific Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-[1000] rounded-lg border border-slate-200/90 bg-white/95 p-2.5 text-xs shadow-md backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Forecast Reliability Tier</div>
          <div className="grid grid-cols-1 gap-1">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
              <span className="text-slate-600 dark:text-slate-300">Very High (80–100%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#06b6d4]" />
              <span className="text-slate-600 dark:text-slate-300">High (65–79%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]" />
              <span className="text-slate-600 dark:text-slate-300">Moderate (50–64%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f97316]" />
              <span className="text-slate-600 dark:text-slate-300">Low (35–49%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
              <span className="text-slate-600 dark:text-slate-300">Very Low (&lt;35% - Bust Alert)</span>
            </div>
          </div>
        </div>

        {/* Quick Active Region Drawer / Card if selected */}
        {activePoint && (
          <div className="absolute top-3 right-3 z-[1000] max-w-xs w-72 rounded-lg border border-slate-200 bg-white/95 p-3.5 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Selected Region</p>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">{activePoint.region}</h4>
              </div>
              <button
                onClick={() => setActivePoint(null)}
                className="text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="rounded bg-slate-50 p-2 dark:bg-slate-800">
                <span className="text-slate-500 block">Confidence</span>
                <span className="text-base font-bold text-cyan-700 dark:text-cyan-400">
                  {activePoint.confidence}%
                </span>
              </div>
              <div className="rounded bg-slate-50 p-2 dark:bg-slate-800">
                <span className="text-slate-500 block">Bust Risk</span>
                <span className="text-base font-bold text-orange-600">
                  {Math.round((activePoint.bust_probability || 0) * 100)}%
                </span>
              </div>
            </div>

            <div className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>Expected Error:</span>
                <span className="font-semibold">±{activePoint.expected_error} mm/°C</span>
              </div>
              <div className="flex justify-between">
                <span>Lead Time:</span>
                <span className="font-semibold">Day {activePoint.lead_time}</span>
              </div>
              <div className="flex justify-between">
                <span>Risk Level:</span>
                <RiskBadge risk={activePoint.risk} />
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <Link
                to={`/regions/${activePoint.region_id || activePoint.region.toLowerCase().replaceAll(' ', '-')}`}
                className="flex-1 rounded bg-cyan-700 py-1.5 text-center text-xs font-medium text-white hover:bg-cyan-800"
              >
                Full Analysis
              </Link>
              <Link
                to={`/explainability?region=${activePoint.region_id}&day=${activePoint.lead_time}`}
                className="flex-1 rounded border border-slate-300 py-1.5 text-center text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Explain AI
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
