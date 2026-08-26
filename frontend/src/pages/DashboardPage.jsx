import { useEffect, useState } from 'react'
import { getMaintenance, getBlocks, getAnalytics } from '../api/client'
import KPICard from '../components/KPICard'
import StatusBadge from '../components/StatusBadge'
import { useTheme } from '../context/ThemeContext'
import { DEPT_COLORS } from '../constants/colors'
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Activity,
  Train,
  TrendingDown,
  Zap,
  BarChart2,
  Brain,
  ShieldAlert,
  Layers,
  ArrowUpRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
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
} from 'recharts'

export default function DashboardPage() {
  const { theme } = useTheme()
  const [analytics, setAnalytics] = useState(null)
  const [tasks, setTasks] = useState([])
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAnalytics(), getMaintenance(), getBlocks()])
      .then(([a, m, b]) => {
        setAnalytics(a.data)
        setTasks(m.data.slice(0, 5))
        setBlocks(b.data.slice(0, 5))
      })
      .catch(() => {
        // Fallback mock data if API fails or backend offline
        setAnalytics({
          kpis: {
            overdue_tasks: 3,
            proposed_blocks: 8,
            approved_blocks: 14,
            overall_availability: 94.2,
            total_conflicts: 2,
            total_delay_saved: 2550, // 42.5 hrs
            avg_block_utilization: 91.8,
            pending_tasks: 12,
          },
          department_workload: [
            { department: 'Engineering', total_tasks: 14, pending: 5 },
            { department: 'S&T', total_tasks: 9, pending: 3 },
            { department: 'Traction', total_tasks: 7, pending: 4 },
          ],
          monthly_trend: [
            { month: 'Apr', utilization: 82, availability: 91 },
            { month: 'May', utilization: 85, availability: 92 },
            { month: 'Jun', utilization: 88, availability: 93 },
            { month: 'Jul', utilization: 90, availability: 94 },
            { month: 'Aug', utilization: 92, availability: 95 },
          ],
          asset_availability: [
            { corridor: 'NDLS-AGR', avg_availability: 96 },
            { corridor: 'HWH-PRYJ', avg_availability: 92 },
            { corridor: 'CSTM-PNVL', avg_availability: 94 },
            { corridor: 'MAS-SBC', avg_availability: 91 },
          ],
        })
        setTasks([
          { id: 1, title: 'Track Tamping & Ballast Cleaning', department: 'Engineering', km_start: 120, km_end: 135, criticality: 9, status: 'Critical', task_code: 'ENG-204' },
          { id: 2, title: 'Axle Counter Sensor Calibration', department: 'S&T', km_start: 122, km_end: 128, criticality: 7, status: 'Pending', task_code: 'SIG-109' },
          { id: 3, title: 'Overhead Line (OHE) Wire Tensioning', department: 'Traction', km_start: 125, km_end: 140, criticality: 8, status: 'Pending', task_code: 'TRD-405' },
        ])
        setBlocks([
          { id: 101, block_code: 'MB-2026-081', corridor_code: 'NDLS-AGR', departments: 'Engineering, S&T, Traction', start_time: '2026-08-24 01:00', end_time: '2026-08-24 05:00', block_utilization: 96, train_conflicts: 0, status: 'Approved' },
          { id: 102, block_code: 'SB-2026-082', corridor_code: 'HWH-PRYJ', departments: 'Engineering', start_time: '2026-08-24 11:30', end_time: '2026-08-24 13:30', block_utilization: 84, train_conflicts: 1, status: 'Proposed' },
        ])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSkeleton />

  const kpis = analytics?.kpis || {}
  const deptWork = analytics?.department_workload || []
  const monthly = analytics?.monthly_trend || []
  const avail = analytics?.asset_availability || []

  const deptPie = deptWork.map(d => ({
    name: d.department,
    value: d.total_tasks,
    color: DEPT_COLORS[d.department] || '#6b7280',
  }))

  const tooltipBg = theme === 'dark' ? '#1e293b' : '#ffffff'
  const tooltipBorder = theme === 'dark' ? '#334155' : '#e2e8f0'
  const tooltipText = theme === 'dark' ? '#f8fafc' : '#0f172a'

  return (
    <div className="space-y-5">
      {/* Government Operational Banner */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 flex items-center justify-center text-red-700 dark:text-red-300 font-extrabold">
            <Train size={22} />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Control Office Operations Monitor
            </div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white">
              Corridor Efficiency Engine · Indian Railways
            </div>
          </div>
        </div>

        {/* Quick Department Active Blocks Breakdown Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Active Departmental Blocks:</span>
          <StatusBadge status="Engineering" label="TMS (Tracks): 14" />
          <StatusBadge status="S&T" label="SMMS (Signals): 9" />
          <StatusBadge status="Traction" label="TDMS (Power): 7" />
          <StatusBadge status="Mega-Block" label="Merged Mega: 14" />
        </div>
      </div>

      {/* ================= PRIMARY DENSE KPI METRICS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Downtime Saved"
          value="42.5 hrs"
          subtitle="Cumulative track possession saved"
          icon={TrendingDown}
          color="green"
          trend={42}
          badgeText="CRIS AI KPI"
        />

        <KPICard
          title="Corridor Efficiency Rate"
          value={`${kpis.overall_availability || 94.2}%`}
          subtitle="Section line availability"
          icon={Activity}
          color="blue"
          trend={4}
        />

        <KPICard
          title="Mega-Blocks vs Single"
          value="14 / 4"
          subtitle="Merged shadow block ratio (78%)"
          icon={Layers}
          color="purple"
          trend={18}
        />

        <KPICard
          title="Critical Maintenance"
          value={kpis.overdue_tasks || 3}
          subtitle="Requires immediate block authorization"
          icon={AlertTriangle}
          color="red"
          trend={-12}
        />
      </div>

      {/* SECONDARY OPERATIONAL METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Pending Block Approvals"
          value={kpis.proposed_blocks || 8}
          subtitle="Awaiting Section Controller sign-off"
          icon={Clock}
          color="amber"
        />

        <KPICard
          title="Train Conflicts Prevented"
          value={kpis.total_conflicts || 2}
          subtitle="Passenger train timetable conflicts"
          icon={Train}
          color="blue"
        />

        <KPICard
          title="Block Utilization Rate"
          value={`${kpis.avg_block_utilization || 91.8}%`}
          subtitle="Average slot work efficiency"
          icon={Zap}
          color="green"
        />

        <KPICard
          title="Unscheduled Backlog"
          value={kpis.pending_tasks || 12}
          subtitle="Tasks queued for AI bundling"
          icon={BarChart2}
          color="amber"
        />
      </div>

      {/* ================= CHARTS & VISUALS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-900 dark:text-white font-bold text-sm flex items-center gap-2">
              <BarChart2 size={18} className="text-blue-600 dark:text-blue-400" />
              Monthly Performance & Asset Line Availability Trend
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Target: ≥90% Utilization</span>
          </div>

          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="availGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="month" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{ fontSize: 11 }} />
              <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{ fontSize: 11 }} domain={[60, 100]} />
              <Tooltip
                contentStyle={{
                  background: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: 8,
                  color: tooltipText,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Area type="monotone" dataKey="utilization" stroke="#3b82f6" fill="url(#utilGrad)" name="Block Utilization %" strokeWidth={2} />
              <Area type="monotone" dataKey="availability" stroke="#10b981" fill="url(#availGrad)" name="Asset Availability %" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Department Workload */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold text-sm mb-3 flex items-center gap-2">
              <Activity size={18} className="text-amber-500" />
              Department Workload Share
            </h3>

            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={deptPie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                  {deptPie.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: 8,
                    color: tooltipText,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            {deptPie.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                  <span className="text-slate-700 dark:text-slate-300">{d.name}</span>
                </div>
                <span className="text-slate-900 dark:text-white font-mono">{d.value} Active Work Orders</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= RECENT WORK ORDERS & TODAY'S SCHEDULE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Maintenance Requests */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-900 dark:text-white font-bold text-sm">
              Urgent Maintenance Work Orders
            </h3>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">View All Matrix →</span>
          </div>

          <div className="space-y-2.5">
            {tasks.map(t => (
              <div
                key={t.id}
                className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-lg hover:border-blue-300 transition-all"
              >
                <div className="w-8 h-8 rounded-md bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  KM
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-900 dark:text-white text-xs font-bold truncate">
                    {t.title}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                    {t.department} · KM {t.km_start}–{t.km_end} · Code: <span className="font-mono text-blue-600 dark:text-blue-400">{t.task_code}</span>
                  </div>
                </div>
                <StatusBadge status={t.department} />
              </div>
            ))}
          </div>
        </div>

        {/* AI Shadow Blocks & Today's Possessions */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-900 dark:text-white font-bold text-sm flex items-center gap-2">
              <Brain size={16} className="text-emerald-500" />
              Approved AI Mega-Blocks
            </h3>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Shadow Block Active</span>
          </div>

          <div className="space-y-2.5">
            {blocks.map(b => (
              <div
                key={b.id}
                className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-lg"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold font-mono text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <Layers size={13} /> {b.block_code}
                  </span>
                  <StatusBadge status={b.status} />
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-xs font-medium">
                  {b.corridor_code} · Departments: <span className="font-semibold">{b.departments}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 text-[11px] font-mono">
                  <span className="text-slate-700 dark:text-slate-300 font-bold">
                    Slot: {b.start_time?.slice(11, 16)} – {b.end_time?.slice(11, 16)}
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                    Util: {b.block_utilization}%
                  </span>
                  <span className="text-amber-700 dark:text-amber-400 font-bold">
                    Conflicts: {b.train_conflicts}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-64 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700" />
        <div className="h-64 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700" />
      </div>
    </div>
  )
}