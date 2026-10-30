import React from 'react'
import { TrendingDown, TrendingUp, AlertCircle, ShieldCheck } from 'lucide-react'

export default function KPIcard({ label, value, subtext, risk, icon: Icon }) {
  const isDanger = risk === 'up' || risk === 'high'
  const isSafe = risk === 'down' || risk === 'safe'

  return (
    <div className="card transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="label">{label}</p>
        {Icon ? (
          <span className="rounded-lg bg-slate-100 p-2 text-cyan-700 dark:bg-slate-800 dark:text-cyan-400">
            <Icon size={18} />
          </span>
        ) : isDanger ? (
          <TrendingUp className="text-orange-500" size={20} />
        ) : isSafe ? (
          <TrendingDown className="text-emerald-600" size={20} />
        ) : null}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </p>
      </div>

      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
        {subtext}
      </p>
    </div>
  )
}
