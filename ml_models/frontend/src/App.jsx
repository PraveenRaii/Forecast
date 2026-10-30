import React, { lazy, Suspense, useState, useEffect, useRef } from 'react'
import { NavLink, Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CloudSun,
  Database,
  Gauge,
  Menu,
  Moon,
  Search,
  Settings2,
  ShieldAlert,
  Sun,
  X,
  Calendar,
  Layers,
  MapPin,
  TrendingUp,
  Compass,
  ArrowRight
} from 'lucide-react'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { searchRegions, getAlerts } from './services/api'

// Lazy-loaded pages for high performance
const Home = lazy(() => import('./pages/Home'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ForecastMap = lazy(() => import('./pages/ForecastMap'))
const Regions = lazy(() => import('./pages/Regions'))
const RegionDetails = lazy(() => import('./pages/RegionDetails'))
const BustAnalysis = lazy(() => import('./pages/BustAnalysis'))
const DayForecastView = lazy(() => import('./pages/DayForecastView'))
const Explainability = lazy(() => import('./pages/Explainability'))
const HistoricalErrors = lazy(() => import('./pages/HistoricalErrors'))
const NWPData = lazy(() => import('./pages/NWPData'))
const ModelPerformance = lazy(() => import('./pages/ModelPerformance'))
const APIStatus = lazy(() => import('./pages/APIStatus'))
const Settings = lazy(() => import('./pages/Settings'))
const About = lazy(() => import('./pages/About'))

// Primary navigation structure
const mainNav = [
  { icon: Gauge, label: 'Dashboard', to: '/dashboard' },
  { icon: Compass, label: 'Confidence Map', to: '/forecast-map' },
  { icon: Database, label: 'Regions', to: '/regions' },
  { icon: ShieldAlert, label: 'Bust Analysis', to: '/bust-analysis' },
  { icon: Calendar, label: 'Day 1–10 View', to: '/day-forecast' },
  { icon: BrainCircuit, label: 'Explainable AI', to: '/explainability' },
  { icon: BarChart3, label: 'Historical Errors', to: '/historical-errors' },
  { icon: Layers, label: 'NWP Data', to: '/nwp-data' },
  { icon: Activity, label: 'Model Performance', to: '/model-performance' },
  { icon: Activity, label: 'API Status', to: '/api-status' }
]

function AppShell() {
  const { dark, setDark } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [activeAlertsCount, setActiveAlertsCount] = useState(0)

  const navigate = useNavigate()
  const location = useLocation()
  const searchRef = useRef(null)

  // Fetch active alerts count for header badge
  useEffect(() => {
    getAlerts()
      .then((res) => {
        if (res && res.alerts) setActiveAlertsCount(res.alerts.length)
      })
      .catch(() => {})
  }, [location.pathname])

  // Handle global search input
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowSearchDropdown(false)
      return
    }

    const timer = setTimeout(() => {
      setSearchLoading(true)
      searchRegions(searchQuery.trim())
        .then((res) => {
          setSearchResults(res.results || [])
          setShowSearchDropdown(true)
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false))
    }, 200)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectSearchResult = (regionId) => {
    setShowSearchDropdown(false)
    setSearchQuery('')
    navigate(`/regions/${regionId}`)
  }

  return (
    <div className="min-h-screen bg-mist text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex h-16 max-w-[1680px] items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-700 text-white shadow-md shadow-cyan-700/20">
                <ShieldAlert size={20} className="text-white" />
              </span>
              <div>
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  WeatherGuard <span className="text-cyan-700 dark:text-cyan-400">AI</span>
                </span>
                <span className="ml-2 hidden text-[10px] font-medium text-slate-500 uppercase tracking-wider xl:inline">
                  NWP Forecast Confidence &amp; Bust Detection
                </span>
              </div>
            </NavLink>
          </div>

          {/* Center: Global Search Bar */}
          <div ref={searchRef} className="relative hidden md:block w-72 lg:w-96">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search 48 Indian subdivisions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchDropdown(true)
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 transition-all focus:border-cyan-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
              />
              {searchLoading && (
                <div className="absolute right-3 h-3 w-3 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
              )}
            </div>

            {/* Live Autocomplete Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="p-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  Subdivisions Found ({searchResults.length})
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelectSearchResult(r.id)}
                      className="w-full text-left p-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/40 last:border-none"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-cyan-700 dark:text-cyan-400 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{r.name}</span>
                          <span className="text-[10px] text-slate-400 block">{r.state || r.zone || 'India'}</span>
                        </div>
                      </div>
                      <ArrowRight size={13} className="text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Active Alerts Pill */}
            {activeAlertsCount > 0 && (
              <NavLink
                to="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-800 dark:bg-red-950 dark:text-red-300 transition-all hover:bg-red-200"
              >
                <AlertTriangle size={13} />
                <span>{activeAlertsCount} Alerts</span>
              </NavLink>
            )}

            {/* Model Badge */}
            <span className="hidden rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 lg:inline">
              GFS 0.25° · 00Z Cycle
            </span>

            {/* Operational Status Pill */}
            <span className="hidden items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 md:inline-flex border border-emerald-200/60 dark:border-emerald-800/40">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE NWP FEED
            </span>

            {/* Theme Toggle */}
            <button
              onClick={() => setDark(!dark)}
              aria-label="Toggle theme"
              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-all hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {dark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
            </button>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 dark:border-slate-800 dark:text-slate-300 lg:hidden"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto flex w-full max-w-[1680px] flex-1">
        {/* Sidebar Navigation */}
        <aside
          className={`${
            mobileMenuOpen
              ? 'fixed inset-x-0 top-16 z-30 block bg-white px-4 pb-6 shadow-xl dark:bg-slate-950'
              : 'hidden'
          } w-64 shrink-0 border-r border-slate-200 p-4 dark:border-slate-800 lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)] lg:overflow-y-auto`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Operations
          </div>
          <nav className="space-y-1">
            {mainNav.map(({ icon: Icon, label, to }) => (
              <NavLink
                key={to}
                onClick={() => setMobileMenuOpen(false)}
                className="nav-item"
                to={to}
              >
                <Icon size={17} />
                <span>{label}</span>
              </NavLink>
            ))}

            <div className="my-4 border-t border-slate-100 dark:border-slate-800" />

            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              System
            </div>
            <NavLink
              onClick={() => setMobileMenuOpen(false)}
              className="nav-item"
              to="/settings"
            >
              <Settings2 size={17} />
              <span>Settings</span>
            </NavLink>
            <NavLink
              onClick={() => setMobileMenuOpen(false)}
              className="nav-item"
              to="/about"
            >
              <CloudSun size={17} />
              <span>Methodology &amp; Architecture</span>
            </NavLink>
          </nav>

          {/* Sidebar Footer Badge */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
              WeatherGuard AI v1.2
            </span>
            <span>NWP Confidence &amp; Bust Detection Prototype. IMD &amp; WMO compliant format.</span>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Suspense fallback={<div className="card text-xs text-slate-500">Loading WeatherGuard AI view...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/forecast-map" element={<ForecastMap />} />
              <Route path="/regions" element={<Regions />} />
              <Route path="/regions/:id" element={<RegionDetails />} />
              <Route path="/bust-analysis" element={<BustAnalysis />} />
              <Route path="/day-forecast" element={<DayForecastView />} />
              <Route path="/explainability" element={<Explainability />} />
              <Route path="/historical-errors" element={<HistoricalErrors />} />
              <Route path="/nwp-data" element={<NWPData />} />
              <Route path="/model-performance" element={<ModelPerformance />} />
              <Route path="/api-status" element={<APIStatus />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  )
}
