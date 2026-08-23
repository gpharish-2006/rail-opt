import { useLocation } from 'react-router-dom'
import { Bell, Settings, Clock } from 'lucide-react'
import useAuthStore from '../store/authStore'

const pageTitles = {
  '/dashboard':   { title: 'Dashboard',             sub: 'Operations Overview' },
  '/maintenance': { title: 'Maintenance Tasks',      sub: 'Track & Manage Maintenance Requests' },
  '/planner':     { title: 'AI Block Planner',       sub: 'Intelligent Block Optimization Engine' },
  '/weekly':      { title: 'Weekly Block Plan',      sub: 'Scheduled Maintenance Calendar' },
  '/comparison':  { title: 'Before vs After',        sub: 'Manual vs AI-Optimized Comparison' },
  '/analytics':   { title: 'Analytics',              sub: 'Performance Metrics & Insights' },
}

export default function TopNav() {
  const { pathname } = useLocation()
  const { user } = useAuthStore()
  const page = pageTitles[pathname] || { title: 'RailOpt AI', sub: '' }
  const now = new Date()

  return (
    <header className="h-16 bg-[#071020]/80 backdrop-blur-md border-b border-blue-900/30 flex items-center px-6 gap-4 sticky top-0 z-20">
      <div className="flex-1">
        <h1 className="text-white font-semibold text-lg leading-tight">{page.title}</h1>
        <p className="text-blue-400 text-xs">{page.sub}</p>
      </div>

      <div className="flex items-center gap-2 text-slate-400 text-xs bg-white/5 px-3 py-2 rounded-lg">
        <Clock size={14} />
        <span>{now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
        <span className="text-blue-400 font-mono">{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div className="flex items-center gap-2">
        <button className="w-9 h-9 rounded-xl bg-white/5 hover:bg-blue-600/20 flex items-center justify-center text-slate-400 hover:text-blue-300 transition-all relative">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full"></span>
        </button>
        <button className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
          <Settings size={16} />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-xl">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.[0] || 'U'}
          </div>
          <span className="text-blue-200 text-sm font-medium">{user?.role || 'engineer'}</span>
        </div>
      </div>
    </header>
  )
}
