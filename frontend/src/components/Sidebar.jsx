import { NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import {
  LayoutDashboard, Wrench, Brain, CalendarDays,
  BarChart3, ArrowLeftRight, LogOut, Train, ChevronRight
} from 'lucide-react'

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/maintenance', icon: Wrench,           label: 'Maintenance' },
  { to: '/planner',     icon: Brain,            label: 'AI Block Planner' },
  { to: '/weekly',      icon: CalendarDays,     label: 'Weekly Plan' },
  { to: '/comparison',  icon: ArrowLeftRight,   label: 'Before vs After' },
  { to: '/analytics',   icon: BarChart3,        label: 'Analytics' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-64 min-h-screen bg-[#071020] border-r border-blue-900/30 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-blue-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center glow-blue">
            <Train size={20} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-lg leading-tight">RailOpt AI</div>
            <div className="text-blue-400 text-xs">Block Planning System</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 glow-blue'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-blue-900/30">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 mb-3">
          <div className="w-9 h-9 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user?.name || 'User'}</div>
            <div className="text-slate-400 text-xs truncate">{user?.department}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-sm transition-all"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  )
}
