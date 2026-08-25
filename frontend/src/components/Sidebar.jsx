import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Wrench,
  Brain,
  CalendarDays,
  BarChart3,
  ArrowLeftRight,
  LogOut,
  TrainFront,
  ChevronRight,
  ShieldAlert,
  Train,
} from 'lucide-react'
import useAuthStore from '../store/authStore'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: 'Live' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance Tasks' },
  { to: '/block-planner', icon: Brain, label: 'AI Block Planner', badge: 'AI Engine' },
  { to: '/weekly-plan', icon: CalendarDays, label: 'Weekly Schedule' },
  { to: '/before-after', icon: ArrowLeftRight, label: 'Before vs After' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/assets', icon: TrainFront, label: 'Rolling Stock' },
  { to: '/emergency', icon: ShieldAlert, label: 'Emergency Override' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-64 min-h-screen bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] border-r border-[var(--sidebar-border)] flex flex-col justify-between select-none transition-colors">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-[var(--sidebar-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-700 to-red-900 border border-red-500/40 flex items-center justify-center text-white shadow-lg glow-amber">
              <Train size={22} />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-wide text-[var(--sidebar-text)] leading-tight">
                RailOpt <span className="text-amber-400 font-mono text-xs">AI</span>
              </div>
              <div className="text-[10px] text-blue-500 dark:text-blue-300 font-semibold tracking-wider uppercase">
                CRIS Block Engine
              </div>
            </div>
          </div>
        </div>

        {/* Operational Menu */}
        <div className="px-3 py-4">
          <div className="px-3 mb-2 text-[10px] font-bold tracking-widest text-[var(--sidebar-muted)] uppercase">
            OPERATIONS & PLANNING
          </div>
          <nav className="space-y-1">
            {navItems.map(({ to, icon: Icon, label, badge }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] shadow-md border border-blue-400/40'
                      : 'text-[var(--sidebar-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)]'
                  }`
                }
              >
                <Icon size={17} />
                <span className="flex-1 truncate">{label}</span>
                {badge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {badge}
                  </span>
                )}
                <ChevronRight size={13} className="opacity-60" />
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* System & User Info Footer */}
      <div className="p-3 border-t border-[var(--sidebar-border)] bg-[color:var(--sidebar-hover-bg)]/80">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] mb-2">
          <div className="w-8 h-8 rounded-md bg-blue-700 flex items-center justify-center text-white font-bold text-xs">
            {user?.name?.[0]?.toUpperCase() || 'IR'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-[var(--text-primary)] truncate">{user?.name || 'Chief Controller'}</div>
            <div className="text-[10px] text-[var(--text-secondary)] truncate">{user?.department || 'Operations'}</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[var(--sidebar-muted)] hover:text-red-500 hover:bg-red-950/10 border border-transparent hover:border-red-800/30 transition-all"
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </aside>
  )
}
