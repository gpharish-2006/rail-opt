import { useEffect, useState } from 'react'
import { getAnalytics } from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts'
import { BarChart3, Activity, Zap, Train, TrendingDown, Users } from 'lucide-react'

const DEPT_COLORS = { Engineering: '#3b82f6', 'S&T': '#a855f7', Traction: '#f59e0b' }
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ef4444']

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalytics().then(r => setAnalytics(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">Loading analytics...</div>

  const deptWork = analytics?.department_workload || []
  const monthly = analytics?.monthly_trend || []
  const avail = analytics?.asset_availability || []
  const blockStats = analytics?.block_statistics || []
  const kpis = analytics?.kpis || {}

  const deptHours = deptWork.map(d => ({
    name: d.department,
    hours: d.total_hours || 0,
    tasks: d.total_tasks,
    pending: d.pending,
    color: DEPT_COLORS[d.department] || '#6b7280',
  }))

  const blockPie = blockStats.map(b => ({
    name: b.status,
    value: b.count,
  }))

  return (
    <div className="space-y-5">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: 'Avg Block Utilization', v: `${kpis.avg_block_utilization || 0}%`, c: 'text-blue-400', icon: Zap },
          { l: 'Total Train Conflicts', v: kpis.total_conflicts || 0, c: 'text-amber-400', icon: Train },
          { l: 'Total Delay Saved', v: `${kpis.total_delay_saved || 0} min`, c: 'text-emerald-400', icon: TrendingDown },
          { l: 'Overall Asset Availability', v: `${kpis.overall_availability || 0}%`, c: 'text-purple-400', icon: Activity },
        ].map(({ l, v, c, icon: Icon }) => (
          <div key={l} className="glass rounded-2xl p-5 border border-blue-900/30 flex items-center gap-4">
            <Icon size={24} className={c} />
            <div>
              <div className={`text-2xl font-bold ${c}`}>{v}</div>
              <div className="text-slate-400 text-xs mt-0.5">{l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Trend */}
      <div className="glass rounded-2xl border border-blue-900/30 p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-blue-400" /> Monthly Performance Trend (Block Utilization & Asset Availability)
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={monthly}>
            <defs>
              <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 12 }} domain={[60, 100]} />
            <Tooltip contentStyle={{ background: '#0f1f3d', border: '1px solid #1e4080', borderRadius: 12, color: '#e2e8f0' }} />
            <Legend />
            <Area type="monotone" dataKey="utilization" stroke="#3b82f6" fill="url(#blueGrad)" name="Block Utilization %" strokeWidth={2} />
            <Area type="monotone" dataKey="availability" stroke="#10b981" fill="url(#greenGrad)" name="Asset Availability %" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Dept Workload */}
        <div className="glass rounded-2xl border border-blue-900/30 p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Users size={18} className="text-purple-400" /> Department Workload
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f1f3d', border: '1px solid #1e4080', borderRadius: 12, color: '#e2e8f0' }} />
              <Bar dataKey="tasks" name="Total Tasks" radius={[4, 4, 0, 0]}>
                {deptHours.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {deptWork.map(d => (
              <div key={d.department} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: DEPT_COLORS[d.department] }} />
                  <span className="text-slate-300">{d.department}</span>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="text-white font-medium">{d.total_tasks} tasks</span>
                  <span className="text-amber-400">{d.pending} pending</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Asset Availability */}
        <div className="glass rounded-2xl border border-blue-900/30 p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Activity size={18} className="text-emerald-400" /> Asset Availability by Corridor
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={avail} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis type="number" domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} unit="%" />
              <YAxis dataKey="corridor" type="category" stroke="#64748b" tick={{ fontSize: 11 }} width={25} />
              <Tooltip contentStyle={{ background: '#0f1f3d', border: '1px solid #1e4080', borderRadius: 12, color: '#e2e8f0' }}
                formatter={v => [`${v}%`, 'Avg Availability']} />
              <Bar dataKey="avg_availability" name="Availability" radius={[0, 6, 6, 0]}>
                {avail.map((e, i) => (
                  <Cell key={i} fill={e.avg_availability >= 90 ? '#10b981' : e.avg_availability >= 75 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-3 mt-4 justify-center text-xs">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-slate-400">≥90% Good</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-slate-400">75-90% Fair</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-slate-400">&lt;75% Poor</span></div>
          </div>
        </div>

        {/* Block Status Pie */}
        <div className="glass rounded-2xl border border-blue-900/30 p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Zap size={18} className="text-amber-400" /> Block Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={blockPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                {blockPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f1f3d', border: '1px solid #1e4080', borderRadius: 12, color: '#e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {blockPie.map((b, i) => (
              <div key={b.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-300">{b.name}</span>
                </div>
                <span className="text-white font-medium">{b.value} blocks</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="glass rounded-2xl border border-blue-900/30 p-5">
        <h3 className="text-white font-semibold mb-4">Department Performance Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-xs uppercase border-b border-blue-900/30">
                {['Department', 'Total Tasks', 'Pending', 'Completed', 'Avg Priority', 'Total Hours'].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deptWork.map(d => (
                <tr key={d.department} className="border-b border-blue-900/20 hover:bg-white/3 transition-all">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: DEPT_COLORS[d.department] }} />
                      <span className="text-white font-medium">{d.department}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white font-bold">{d.total_tasks}</td>
                  <td className="px-4 py-3 text-amber-400">{d.pending}</td>
                  <td className="px-4 py-3 text-emerald-400">{d.completed}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${(d.avg_priority / 10) * 100}%` }} />
                      </div>
                      <span className="text-slate-300 text-xs">{d.avg_priority}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{d.total_hours?.toFixed(1)}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
