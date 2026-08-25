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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts'
import { ArrowLeftRight, TrendingDown, TrendingUp, Clock, Train, Zap, Layers, CheckCircle2 } from 'lucide-react'

export default function BeforeAfterPage() {
  const { theme } = useTheme()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalytics()
      .then(r => setAnalytics(r.data))
      .catch(() => {
        // Mock analytics data fallback
        setAnalytics({
          comparison: {
            manual: {
              blocks_per_week: 18,
              avg_duration_hr: 5.2,
              train_conflicts: 14,
              delay_min: 320,
              utilization_pct: 62,
              tasks_combined_per_block: 1.1,
            },
            ai_optimized: {
              blocks_per_week: 6,
              avg_duration_hr: 3.8,
              train_conflicts: 2,
              delay_min: 45,
              utilization_pct: 94,
              tasks_combined_per_block: 3.2,
            },
          },
        })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-12 text-center text-slate-500 font-bold">Loading comparison metrics...</div>

  const cmp = analytics?.comparison || {}
  const manual = cmp.manual || { blocks_per_week: 18, avg_duration_hr: 5.2, train_conflicts: 14, delay_min: 320, utilization_pct: 62, tasks_combined_per_block: 1.1 }
  const ai = cmp.ai_optimized || { blocks_per_week: 6, avg_duration_hr: 3.8, train_conflicts: 2, delay_min: 45, utilization_pct: 94, tasks_combined_per_block: 3.2 }

  const barData = [
    { metric: 'Blocks / Week', manual: manual.blocks_per_week, ai: ai.blocks_per_week },
    { metric: 'Avg Duration (hrs)', manual: manual.avg_duration_hr, ai: ai.avg_duration_hr },
    { metric: 'Train Conflicts', manual: manual.train_conflicts, ai: ai.train_conflicts },
    { metric: 'Delay (min ÷ 10)', manual: Math.round((manual.delay_min || 0) / 10), ai: Math.round((ai.delay_min || 0) / 10) },
  ]

  const radarData = [
    { subject: 'Block Efficiency', manual: manual.utilization_pct, ai: ai.utilization_pct },
    { subject: 'Task Combining', manual: manual.tasks_combined_per_block * 25, ai: ai.tasks_combined_per_block * 25 },
    { subject: 'Conflict Elimination', manual: Math.max(0, 100 - manual.train_conflicts * 6), ai: Math.max(0, 100 - ai.train_conflicts * 6) },
    { subject: 'Punctuality Support', manual: Math.max(0, 100 - Math.round(manual.delay_min / 5)), ai: Math.max(0, 100 - Math.round(ai.delay_min / 5)) },
  ]

  const tooltipBg = theme === 'dark' ? '#1e293b' : '#ffffff'
  const tooltipBorder = theme === 'dark' ? '#334155' : '#e2e8f0'
  const tooltipText = theme === 'dark' ? '#f8fafc' : '#0f172a'

  return (
    <div className="space-y-6">
      {/* Hero Banner Header */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <ArrowLeftRight size={20} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Uncoordinated BDMS Approvals vs AI-Optimized Mega-Blocks
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Comparative Impact Analysis of Automated Shadow Block Merging Engine
            </p>
          </div>
        </div>

        {/* Side by Side Main Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Before: Manual Uncoordinated Approvals */}
          <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 border-b border-red-200 dark:border-red-900/50 pb-2">
              <h3 className="text-sm font-black text-red-800 dark:text-red-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Uncoordinated BDMS Approvals (BEFORE)
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-100">
                MANUAL TRADITIONAL
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center">
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-red-100 dark:border-red-950">
                <div className="text-lg font-black font-mono text-red-700 dark:text-red-400">{manual.blocks_per_week}</div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Line Possessions/Wk</div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-red-100 dark:border-red-950">
                <div className="text-lg font-black font-mono text-red-700 dark:text-red-400">{manual.avg_duration_hr}h</div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Avg Block Duration</div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-red-100 dark:border-red-950">
                <div className="text-lg font-black font-mono text-red-700 dark:text-red-400">{manual.train_conflicts}</div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Train Conflicts</div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-red-100 dark:border-red-950">
                <div className="text-lg font-black font-mono text-red-700 dark:text-red-400">{manual.delay_min} min</div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Punctuality Loss</div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-red-100 dark:border-red-950">
                <div className="text-lg font-black font-mono text-red-700 dark:text-red-400">{manual.utilization_pct}%</div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Slot Efficiency</div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-red-100 dark:border-red-950">
                <div className="text-lg font-black font-mono text-red-700 dark:text-red-400">{manual.tasks_combined_per_block}x</div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Tasks Combined</div>
              </div>
            </div>
          </div>

          {/* After: AI-Optimized Mega-Blocks */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 border-b border-emerald-200 dark:border-emerald-900/50 pb-2">
              <h3 className="text-sm font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> AI-Optimized Shadow Mega-Blocks (AFTER)
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100">
                CRIS AI ENGINE
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center">
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-950">
                <div className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400">{ai.blocks_per_week}</div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Line Possessions/Wk</div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-950">
                <div className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400">{ai.avg_duration_hr}h</div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Avg Block Duration</div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-950">
                <div className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400">{ai.train_conflicts}</div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Train Conflicts</div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-950">
                <div className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400">{ai.delay_min} min</div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Punctuality Loss</div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-950">
                <div className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400">{ai.utilization_pct}%</div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Slot Efficiency</div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-950">
                <div className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400">{ai.tasks_combined_per_block}x</div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Tasks Combined</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart Comparison */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-xs">
          <h3 className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider mb-4">
            Side-by-Side Performance Comparison
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="metric" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{ fontSize: 11 }} />
              <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, color: tooltipText }} />
              <Bar dataKey="manual" fill="#ef4444" name="Manual BDMS" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ai" fill="#10b981" name="AI Mega-Block" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Performance Matrix */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-xs">
          <h3 className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider mb-4">
            Operational Excellence Radar
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} />
              <Radar name="Manual BDMS" dataKey="manual" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} />
              <Radar name="AI Mega-Block" dataKey="ai" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
              <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, color: tooltipText }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
