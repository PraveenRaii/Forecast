import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
  Legend,
  ComposedChart,
  Cell
} from 'recharts'

export function ConfidenceTrend({ data, height = 280 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0891b2" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#0891b2" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="lead_time" tickFormatter={(v) => `D${v}`} stroke="#64748b" />
        <YAxis domain={[0, 100]} stroke="#64748b" />
        <Tooltip
          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
          formatter={(val) => [`${val}%`, 'Confidence Score']}
          labelFormatter={(lbl) => `Lead Time: Day ${lbl}`}
        />
        <Area type="monotone" dataKey="confidence" stroke="#0891b2" strokeWidth={2.5} fill="url(#confidenceGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function BustBars({ data, height = 280 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="region" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={60} stroke="#64748b" />
        <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} stroke="#64748b" />
        <Tooltip
          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
          formatter={(v) => [`${Math.round(v * 100)}%`, 'Bust Probability']}
        />
        <Bar dataKey="bust_probability" radius={[4, 4, 0, 0]}>
          {data.map((entry, idx) => {
            const prob = entry.bust_probability || 0
            const fill = prob > 0.6 ? '#dc2626' : prob > 0.4 ? '#f97316' : prob > 0.25 ? '#eab308' : '#10b981'
            return <Cell key={`cell-${idx}`} fill={fill} />
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ErrorLine({ data, height = 280 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="lead_time" tickFormatter={(v) => `Day ${v}`} stroke="#64748b" />
        <YAxis stroke="#64748b" />
        <Tooltip
          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
        />
        <Legend />
        <Line type="monotone" name="MAE (Mean Absolute Error)" dataKey="mae" stroke="#0891b2" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" name="RMSE (Root Mean Sq Error)" dataKey="rmse" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function ForecastVsActualChart({ data, height = 280 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="lead_time" tickFormatter={(v) => `D${v}`} stroke="#64748b" />
        <YAxis yAxisId="left" stroke="#0891b2" label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fill: '#0891b2', fontSize: 11 }} />
        <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" label={{ value: 'Rain (mm)', angle: 90, position: 'insideRight', fill: '#3b82f6', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
        />
        <Legend />
        <Line yAxisId="left" type="monotone" name="NWP Temp (°C)" dataKey="temperature_2m" stroke="#f97316" strokeWidth={2} />
        <Line yAxisId="left" type="monotone" name="Ref Temp (°C)" dataKey="reference_temperature" stroke="#64748b" strokeDasharray="4 4" strokeWidth={2} />
        <Bar yAxisId="right" name="NWP Rain (mm)" dataKey="rainfall" fill="#06b6d4" opacity={0.7} radius={[4, 4, 0, 0]} />
        <Bar yAxisId="right" name="Ref Rain (mm)" dataKey="reference_rainfall" fill="#3b82f6" opacity={0.4} radius={[4, 4, 0, 0]} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export function FeatureImportanceChart({ factors, height = 280 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={factors}
        layout="vertical"
        margin={{ top: 10, right: 20, left: 90, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis type="number" stroke="#64748b" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
        <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
          formatter={(v, name, item) => [
            `${(v * 100).toFixed(1)}% contribution`,
            item.payload.direction === 'increases_bust' ? 'Risky (+)' : 'Stabilizing (-)'
          ]}
        />
        <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
          {factors.map((f, i) => (
            <Cell
              key={`cell-${i}`}
              fill={f.direction === 'increases_bust' ? '#ef4444' : '#10b981'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ErrorDistributionHistogram({ data, height = 240 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="bin" stroke="#64748b" tick={{ fontSize: 11 }} />
        <YAxis stroke="#64748b" />
        <Tooltip
          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
          formatter={(v) => [`${v} cases`, 'Frequency']}
        />
        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
