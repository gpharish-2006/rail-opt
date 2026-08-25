import { useEffect, useState } from 'react'
import { getAnalytics } from '../api/client'
import { useTheme } from '../context/ThemeContext'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts'
import { BarChart3, Activity, Zap, Train, TrendingDown, Users } from 'lucide-react'

const DEPT_COLORS = { Engineering: '#ef4444', 'S&T': '#f59e0b', Traction: '#3b82f6' }
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ef4444']

export default function AnalyticsPage() {
  const { theme } = useTheme()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalytics()
      .then(r => setAnalytics(r.data))
      .catch(() => {
        // Fallback mock analytics
        setAnalytics({
          kpis: {
            avg_block_utilization: 91.8,
            total_conflicts: 2,
            total_delay_saved: 2550,
            overall_availability: 94.2,
          },
          monthly_trend: [
            { month: 'Apr', utilization: 82, availability: 91 },
            { month: 'May', utilization: 85, availability: 92 },
            { month: 'Jun', utilization: 88, availability: 93 },
            { month: 'Jul', utilization: 90, availability: 94 },
            { month: 'Aug', utilization: 92, availability: 95 },
          ],
          department_workload: [
            { department: 'Engineering', total_tasks: 14, pending: 5, completed: 9, avg_priority: 8.2, total_hours: 48.5 },
            { department: 'S&T', total_tasks: 9, pending: 3, completed: 6, avg_priority: 7.1, total_hours: 22.0 },
            { department: 'Traction', total_tasks: 7, pending: 4, completed: 3, avg_priority: 7.9, total_hours: 31.5 },
          ],
          asset_availability: [
            { corridor: 'NDLS-AGR', avg_availability: 96 },
            { corridor: 'HWH-PRYJ', avg_availability: 92 },
            { corridor: 'CSTM-PNVL', avg_availability: 94 },
            { corridor: 'MAS-SBC', avg_availability: 91 },
          ],
          block_statistics: [
            { status: 'Approved', count: 14 },
            { status: 'Proposed', count: 8 },
            { status: 'Pending', count: 5 },
          ],
        })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-12 text-center text-slate-500 font-bold">Loading analytics metrics...</div>

  const kpis = analytics?.kpis || {}
  const monthly = analytics?.monthly_trend || []
  const deptWork = analytics?.department_workload || []
  const avail = analytics?.asset_availability || []
  const blockStats = analytics?.block_statistics || []

  const blockPie = blockStats.map(b => ({
    name: b.status,
    value: b.count,
  }))

  const tooltipBg = theme === 'dark' ? '#1e293b' : '#ffffff'
  const tooltipBorder = theme === 'dark' ? '#334155' : '#e2e8f0'
  const tooltipText = theme === 'dark' ? '#f8fafc' : '#0f172a'

  return (
    <div className="space-y-5">
      {/* Top Analytics KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: 'Avg Block Utilization', v: `${kpis.avg_block_utilization || 0}%`, c: 'text-blue-600 dark:text-blue-400', icon: Zap },
          { l: 'Total Train Conflicts', v: kpis.total_conflicts || 0, c: 'text-amber-600 dark:text-amber-400', icon: Train },
          { l: 'Total Delay Saved', v: `${kpis.total_delay_saved || 0} min`, c: 'text-emerald-600 dark:text-emerald-400', icon: TrendingDown },
          { l: 'Overall Line Availability', v: `${kpis.overall_availability || 0}%`, c: 'text-purple-600 dark:text-purple-400', icon: Activity },
        ].map(({ l, v, c, icon: Icon }) => (
          <div key={l} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xs flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center ${c}`}>
              <Icon size={20} />
            </div>
            <div>
              <div className={`text-xl font-extrabold font-mono ${c}`}>{v}</div>
              <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-0.5">{l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Performance Area Chart */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-xs">
        <h3 className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-blue-600" />
          Monthly Block Efficiency & Line Availability Trend
        </h3>

        <ResponsiveContainer width="100%" height={250}>
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
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
            <XAxis dataKey="month" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{ fontSize: 11 }} />
            <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{ fontSize: 11 }} domain={[60, 100]} />
            <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, color: tooltipText }} />
            <Legend />
            <Area type="monotone" dataKey="utilization" stroke="#3b82f6" fill="url(#blueGrad)" name="Block Utilization %" strokeWidth={2} />
            <Area type="monotone" dataKey="availability" stroke="#10b981" fill="url(#greenGrad)" name="Asset Availability %" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Grid of Sub-charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Department Workload Bar Chart */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xs">
          <h3 className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            <Users size={16} className="text-purple-600" /> Department Work Orders
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={deptWork}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="department" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{ fontSize: 10 }} />
              <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, color: tooltipText }} />
              <Bar dataKey="total_tasks" name="Total Tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Availability by Corridor */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xs">
          <h3 className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity size={16} className="text-emerald-600" /> Corridor Availability
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={avail} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
              <XAxis type="number" domain={[0, 100]} stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{ fontSize: 10 }} unit="%" />
              <YAxis dataKey="corridor" type="category" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{ fontSize: 10 }} width={30} />
              <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, color: tooltipText }} />
              <Bar dataKey="avg_availability" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Block Status Pie Chart */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xs">
          <h3 className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            <Zap size={16} className="text-amber-500" /> Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={blockPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                {blockPie.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, color: tooltipText }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Department Performance Matrix Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-xs">
        <h3 className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider mb-3">
          CRIS Departmental Performance Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
                {['Department', 'Total Tasks', 'Pending', 'Completed', 'Avg Priority', 'Total Hours'].map(h => (
                  <th key={h} className="p-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deptWork.map(d => (
                <tr key={d.department} className="border-b border-slate-100 dark:border-slate-700/60 font-medium">
                  <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: DEPT_COLORS[d.department] || '#3b82f6' }}></span>
                    {d.department}
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{d.total_tasks}</td>
                  <td className="p-3 font-mono text-amber-600 font-bold">{d.pending}</td>
                  <td className="p-3 font-mono text-emerald-600 font-bold">{d.completed ?? (d.total_tasks - d.pending)}</td>
                  <td className="p-3 font-mono font-bold text-blue-600">{d.avg_priority ?? 8.0} / 10</td>
                  <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{d.total_hours} hrs</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
