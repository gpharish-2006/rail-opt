import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Sun, Moon, Clock, ShieldCheck, Search, Train } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { useTheme } from '../context/ThemeContext'

const pageTitles = {
  '/dashboard': { title: 'Operational Dashboard', sub: 'Corridor Status & Key Operational Metrics' },
  '/maintenance': { title: 'Maintenance Tasks Matrix', sub: 'TMS, SMMS & TDMS Work Orders' },
  '/block-planner': { title: 'AI Block Optimization Engine', sub: 'Shadow Block & Multi-Department Merging' },
  '/weekly-plan': { title: 'Weekly Maintenance Calendar', sub: 'Approved Line Block Schedules' },
  '/before-after': { title: 'Re-Scheduler Analytics', sub: 'Manual BDMS vs AI Mega-Block Comparison' },
  '/analytics': { title: 'System Analytics & KPIs', sub: 'Corridor Availability & Delay Trends' },
  '/assets': { title: 'Rolling Stock & Track Assets', sub: 'Fleet & Infrastructure Health' },
  '/emergency': { title: 'Emergency Block Override', sub: 'Unscheduled Breakdowns & Emergency Track Possession' },
}

export default function TopNav() {
  const { pathname } = useLocation()
  const { user } = useAuthStore()
  const { theme, toggleTheme } = useTheme()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const currentPage = pageTitles[pathname] || { title: 'RailOpt AI Engine', sub: 'Indian Railways' }

  return (
    <header className="sticky top-0 z-30 bg-[var(--header-bg)] text-[var(--header-text)] border-b border-[var(--card-border)] shadow-md transition-colors">
      {/* Top Banner (Government Header) */}
      <div className="px-4 py-1 bg-[var(--header-banner)] text-[10px] uppercase font-bold tracking-wider text-[var(--header-muted)] flex items-center justify-between border-b border-[var(--card-border)]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-amber-400">
            <ShieldCheck size={12} /> BHARAT SARKAR / GOVERNMENT OF INDIA
          </span>
          <span className="hidden sm:inline text-[var(--header-muted)]/80">|</span>
          <span className="hidden sm:inline text-[var(--header-muted)]">MINISTRY OF RAILWAYS</span>
          <span className="hidden md:inline text-[var(--header-muted)]/80">|</span>
          <span className="hidden md:inline text-blue-600 dark:text-blue-300">CENTRE FOR RAILWAY INFORMATION SYSTEMS (CRIS)</span>
        </div>
        <div className="flex items-center gap-3 text-[var(--header-muted)] font-mono">
          <span className="inline-flex items-center gap-1 text-emerald-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            LIVE OPERATIONAL FEED
          </span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Title & Page Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-800/80 border border-red-600/50 flex items-center justify-center text-white shadow-sm font-bold text-xs">
            <Train size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-[var(--header-text)] flex items-center gap-2">
              {currentPage.title}
            </h1>
            <p className="text-xs text-blue-600 dark:text-blue-300 font-medium">{currentPage.sub}</p>
          </div>
        </div>

        {/* Right Section: Time, Search, Theme Toggle, User Profile */}
        <div className="flex items-center gap-3">
          {/* Live IST Clock */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg text-xs font-mono text-[var(--text-primary)]">
            <Clock size={14} className="text-blue-500 dark:text-blue-400" />
            <span>
              {time.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className="text-amber-400 font-bold">
              {time.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })}{' '}
              IST
            </span>
          </div>

          {/* Global Theme Switcher */}
          <button
            type="button"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            aria-pressed={theme === 'dark'}
            onClick={toggleTheme}
            title={`Switch site theme to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className={`group relative inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 shadow-sm transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
              theme === 'dark'
                ? 'border-sky-500/60 bg-slate-800/90 text-sky-100 shadow-sky-950/30'
                : 'border-amber-300/70 bg-gradient-to-r from-amber-100 via-white to-slate-100 text-slate-800 shadow-amber-200/50'
            }`}
          >
            <span className="relative flex h-6 w-11 items-center rounded-full border border-current/20 bg-black/10 p-1">
              <span
                className={`absolute flex h-4 w-4 items-center justify-center rounded-full transition-all duration-200 ${
                  theme === 'dark' ? 'translate-x-5 bg-sky-400 text-slate-900' : 'translate-x-0 bg-amber-400 text-slate-900'
                }`}
              >
                {theme === 'dark' ? <Moon size={10} /> : <Sun size={10} />}
              </span>
            </span>
            <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-[0.12em] leading-none">
              {theme === 'dark' ? 'Night' : 'Day'}
            </span>
          </button>

          {/* Notifications */}
          <button className="relative w-9 h-9 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-600/60 flex items-center justify-center text-slate-300 hover:text-white transition-all">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 px-3 py-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg">
            <div className="w-7 h-7 rounded-md bg-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {user?.name?.[0]?.toUpperCase() || 'IR'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-[var(--text-primary)] leading-none">{user?.name || 'Chief Controller'}</div>
              <div className="text-[10px] text-[var(--text-secondary)] font-medium leading-tight">
                {user?.department || 'Northern Railway'} · {user?.role || 'Officer'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
