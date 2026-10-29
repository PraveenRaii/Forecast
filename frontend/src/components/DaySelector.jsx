import React from 'react'

export default function DaySelector({ day, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
      <span className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hidden sm:inline">
        Lead Time:
      </span>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const isSelected = day === n
        return (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              isSelected
                ? 'bg-cyan-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-700/60'
            }`}
          >
            Day {n}
          </button>
        )
      })}
    </div>
  )
}
