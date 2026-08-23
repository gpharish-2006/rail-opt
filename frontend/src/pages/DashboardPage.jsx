import { useEffect, useState } from 'react'
import { getMaintenance, getBlocks, getAnalytics } from '../api/client'
import KPICard from '../components/KPICard'
import StatusBadge from '../components/StatusBadge'
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Activity,
  Train,
  TrendingDown,
  Zap,
  BarChart2,
  Brain
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
  Cell
} from 'recharts'

const DEPT_COLORS = {
  Engineering: '#3b82f6',
  'S&T': '#a855f7',
  Traction: '#f59e0b'
}

const PANEL =
  'bg-white rounded-2xl p-5 border border-slate-200 shadow-sm'

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState(null)
  const [tasks, setTasks] = useState([])
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAnalytics(), getMaintenance(), getBlocks()])
      .then(([a, m, b]) => {
        setAnalytics(a.data)
        setTasks(m.data.slice(0, 5))
        setBlocks(b.data.slice(0, 4))
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
    color: DEPT_COLORS[d.department] || '#6b7280'
  }))

  return (
    <div className="space-y-6">

      {/* ================= KPI ROW 1 ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Critical Tasks"
          value={kpis.overdue_tasks || 0}
          subtitle="Require immediate action"
          icon={AlertTriangle}
          color="red"
          trend={-12}
        />

        <KPICard
          title="Pending Blocks"
          value={kpis.proposed_blocks || 0}
          subtitle="Awaiting approval"
          icon={Clock}
          color="amber"
        />

        <KPICard
          title="Optimized Blocks"
          value={kpis.approved_blocks || 0}
          subtitle="AI-generated & approved"
          icon={CheckCircle2}
          color="green"
          trend={8}
        />

        <KPICard
          title="Asset Availability"
          value={`${kpis.overall_availability || 0}%`}
          subtitle="Fleet-wide average"
          icon={Activity}
          color="blue"
          trend={3}
        />
      </div>

      {/* ================= KPI ROW 2 ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Train Conflicts"
          value={kpis.total_conflicts || 0}
          subtitle="Total block conflicts"
          icon={Train}
          color="amber"
        />

        <KPICard
          title="Delay Saved"
          value={`${kpis.total_delay_saved || 0} min`}
          subtitle="vs manual planning"
          icon={TrendingDown}
          color="green"
          trend={42}
        />

        <KPICard
          title="Block Utilization"
          value={`${kpis.avg_block_utilization || 0}%`}
          subtitle="Average block efficiency"
          icon={Zap}
          color="purple"
          trend={15}
        />

        <KPICard
          title="Pending Tasks"
          value={kpis.pending_tasks || 0}
          subtitle="Awaiting scheduling"
          icon={BarChart2}
          color="blue"
        />
      </div>

      {/* ================= CHARTS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Monthly Trend */}
        <div className={`lg:col-span-2 ${PANEL}`}>
          <h3 className="text-slate-800 font-semibold mb-4 flex items-center gap-2">
            <BarChart2 size={18} className="text-blue-500" />
            Monthly Performance Trend
          </h3>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#3b82f6"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor="#3b82f6"
                    stopOpacity={0}
                  />
                </linearGradient>

                <linearGradient id="availGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#10b981"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor="#10b981"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
              />

              <XAxis
                dataKey="month"
                stroke="#64748b"
                tick={{ fontSize: 12 }}
              />

              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 12 }}
              />

              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  color: '#172033',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)'
                }}
              />

              <Area
                type="monotone"
                dataKey="utilization"
                stroke="#3b82f6"
                fill="url(#utilGrad)"
                name="Block Utilization %"
                strokeWidth={2}
              />

              <Area
                type="monotone"
                dataKey="availability"
                stroke="#10b981"
                fill="url(#availGrad)"
                name="Asset Availability %"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Department Workload */}
        <div className={PANEL}>
          <h3 className="text-slate-800 font-semibold mb-4 flex items-center gap-2">
            <Activity size={18} className="text-purple-500" />
            Department Workload
          </h3>

          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={deptPie}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {deptPie.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>

              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  color: '#172033',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-2 mt-2">
            {deptPie.map(d => (
              <div
                key={d.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: d.color }}
                  />

                  <span className="text-slate-600">
                    {d.name}
                  </span>
                </div>

                <span className="text-slate-800 font-medium">
                  {d.value} tasks
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= ASSET + AI ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Asset Availability */}
        <div className={PANEL}>
          <h3 className="text-slate-800 font-semibold mb-4 flex items-center gap-2">
            <Zap size={18} className="text-amber-500" />
            Asset Availability by Corridor
          </h3>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={avail} layout="vertical">

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
              />

              <XAxis
                type="number"
                domain={[0, 100]}
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                unit="%"
              />

              <YAxis
                dataKey="corridor"
                type="category"
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                width={30}
              />

              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  color: '#172033',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)'
                }}
                formatter={v => [`${v}%`, 'Availability']}
              />

              <Bar
                dataKey="avg_availability"
                fill="#3b82f6"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Recommendation */}
        <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-sm">

          <div className="flex items-center gap-2 mb-4">
            <Brain size={18} className="text-blue-500" />

            <h3 className="text-slate-800 font-semibold">
              AI Recommendation
            </h3>

            <span className="ml-auto px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full border border-blue-200">
              Live
            </span>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100 mb-3">

            <div className="flex justify-between items-start mb-2">

              <div>
                <div className="text-slate-800 font-bold text-lg">
                  Corridor C2 — Delhi–Agra
                </div>

                <div className="text-blue-600 text-sm">
                  10:00 PM – 02:00 AM · Multi-dept
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-600">
                  94
                </div>

                <div className="text-slate-500 text-xs">
                  Priority
                </div>
              </div>

            </div>

            <div className="grid grid-cols-3 gap-3 mt-3">

              {[
                { l: 'Departments', v: '3' },
                { l: 'Conflicts', v: '1' },
                { l: 'Utilization', v: '96%' }
              ].map(({ l, v }) => (
                <div key={l} className="text-center">
                  <div className="text-slate-800 font-bold">
                    {v}
                  </div>

                  <div className="text-slate-500 text-xs">
                    {l}
                  </div>
                </div>
              ))}

            </div>
          </div>

          <div className="space-y-1.5">
            {[
              'Engineering + S&T + Traction coordinated',
              'Low train traffic window selected',
              '3 tasks combined into 1 block'
            ].map(t => (
              <div
                key={t}
                className="flex items-center gap-2 text-xs text-slate-600"
              >
                <span className="text-emerald-500">✓</span>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= RECENT TASKS + BLOCKS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Maintenance */}
        <div className={PANEL}>
          <h3 className="text-slate-800 font-semibold mb-4">
            Recent Maintenance Tasks
          </h3>

          <div className="space-y-2">
            {tasks.map(t => (
              <div
                key={t.id}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all"
              >

                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    t.criticality >= 9
                      ? 'bg-red-500'
                      : t.criticality >= 7
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                  }`}
                />

                <div className="flex-1 min-w-0">

                  <div className="text-slate-800 text-sm font-medium truncate">
                    {t.title}
                  </div>

                  <div className="text-slate-500 text-xs">
                    {t.department} · KM {t.km_start}–{t.km_end}
                  </div>

                </div>

                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Today's Blocks */}
        <div className={PANEL}>
          <h3 className="text-slate-800 font-semibold mb-4">
            Today's Blocks
          </h3>

          <div className="space-y-2">
            {blocks.map(b => (
              <div
                key={b.id}
                className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all"
              >

                <div className="flex items-center justify-between mb-1">

                  <span className="text-blue-600 font-medium text-sm">
                    {b.block_code}
                  </span>

                  <StatusBadge status={b.status} />

                </div>

                <div className="text-slate-500 text-xs">
                  {b.corridor_code} · {b.departments}
                </div>

                <div className="flex items-center gap-3 mt-1.5">

                  <span className="text-xs text-slate-700">
                    {b.start_time?.slice(11, 16)} –{' '}
                    {b.end_time?.slice(11, 16)}
                  </span>

                  <span className="text-xs text-emerald-600">
                    {b.block_utilization}% util
                  </span>

                  <span className="text-xs text-amber-600">
                    {b.train_conflicts} conflict
                    {b.train_conflicts !== 1 ? 's' : ''}
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
    <div className="space-y-6 animate-pulse">

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-28 bg-white rounded-2xl border border-slate-200"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="lg:col-span-2 h-64 bg-white rounded-2xl border border-slate-200" />

        <div className="h-64 bg-white rounded-2xl border border-slate-200" />

      </div>
    </div>
  )
}