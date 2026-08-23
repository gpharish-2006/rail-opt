import { useEffect, useState } from 'react'
import { getAnalytics } from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  Radar, AreaChart, Area
} from 'recharts'
import { ArrowLeftRight, TrendingDown, TrendingUp, Clock, Train, Zap } from 'lucide-react'

export default function BeforeAfterPage() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalytics().then(r => setAnalytics(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>

  const cmp = analytics?.comparison || {}
  const manual = cmp.manual || {}
  const ai = cmp.ai_optimized || {}

  const barData = [
    { metric: 'Blocks/Week', manual: manual.blocks_per_week, ai: ai.blocks_per_week },
    { metric: 'Avg Duration (h)', manual: manual.avg_duration_hr, ai: ai.avg_duration_hr },
    { metric: 'Train Conflicts', manual: manual.train_conflicts, ai: ai.train_conflicts },
    { metric: 'Delay (min÷10)', manual: (manual.delay_min || 0) / 10, ai: (ai.delay_min || 0) / 10 },
  ]

  const radarData = [
    { subject: 'Block Count', manual: 100 - (manual.blocks_per_week || 0) * 10, ai: 100 - (ai.blocks_per_week || 0) * 10 },
    { subject: 'Utilization', manual: manual.utilization_pct, ai: ai.utilization_pct },
    { subject: 'Task Combining', manual: manual.tasks_combined_per_block * 20, ai: ai.tasks_combined_per_block * 20 },
    { subject: 'Low Conflicts', manual: Math.max(0, 100 - manual.train_conflicts * 8), ai: Math.max(0, 100 - ai.train_conflicts * 8) },
    { subject: 'Low Delay', manual: Math.max(0, 100 - manual.delay_min), ai: Math.max(0, 100 - ai.delay_min) },
  ]

  const improvements = [
    { label: 'Blocks Per Week', manual: `${manual.blocks_per_week} blocks`, ai: `${ai.blocks_per_week} blocks`,
      improvement: `${Math.round((1 - ai.blocks_per_week / manual.blocks_per_week) * 100)}% fewer blocks`, good: true,
      icon: TrendingDown },
    { label: 'Avg Block Duration', manual: `${manual.avg_duration_hr} hours`, ai: `${ai.avg_duration_hr} hours`,
      improvement: `${Math.round((1 - ai.avg_duration_hr / manual.avg_duration_hr) * 100)}% shorter`, good: true,
      icon: Clock },
    { label: 'Train Conflicts', manual: `${manual.train_conflicts} conflicts`, ai: `${ai.train_conflicts} conflicts`,
      improvement: `${Math.round((1 - ai.train_conflicts / manual.train_conflicts) * 100)}% fewer conflicts`, good: true,
      icon: Train },
    { label: 'Estimated Delay', manual: `${manual.delay_min} min`, ai: `${ai.delay_min} min`,
      improvement: `${Math.round((1 - ai.delay_min / manual.delay_min) * 100)}% less delay`, good: true,
      icon: TrendingDown },
    { label: 'Block Utilization', manual: `${manual.utilization_pct}%`, ai: `${ai.utilization_pct}%`,
      improvement: `+${ai.utilization_pct - manual.utilization_pct}% utilization`, good: true,
      icon: Zap },
    { label: 'Tasks Per Block', manual: `${manual.tasks_combined_per_block}x`, ai: `${ai.tasks_combined_per_block}x`,
      improvement: `${Math.round(ai.tasks_combined_per_block / manual.tasks_combined_per_block)}x more tasks combined`, good: true,
      icon: TrendingUp },
  ]

  return (
    <div className="space-y-6">
      {/* Hero Comparison Banner */}
      <div className="glass rounded-2xl border border-blue-900/30 p-6">
        <div className="flex items-center gap-2 mb-6">
          <ArrowLeftRight size={20} className="text-blue-400" />
          <h2 className="text-white font-bold text-xl">Manual vs AI-Optimized Block Planning</h2>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {/* Manual */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <h3 className="text-red-300 font-bold text-lg">Manual Planning</h3>
              <span className="ml-auto text-red-400 text-xs bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">BEFORE</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Blocks/Week', manual.blocks_per_week],
                ['Avg Duration', `${manual.avg_duration_hr}h`],
                ['Train Conflicts', manual.train_conflicts],
                ['Delay/Week', `${manual.delay_min} min`],
                ['Utilization', `${manual.utilization_pct}%`],
                ['Tasks/Block', `${manual.tasks_combined_per_block}x`],
              ].map(([l, v]) => (
                <div key={l} className="text-center p-3 bg-red-500/5 rounded-xl">
                  <div className="text-red-300 font-bold text-xl">{v}</div>
                  <div className="text-slate-400 text-xs mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <h3 className="text-emerald-300 font-bold text-lg">AI-Optimized</h3>
              <span className="ml-auto text-emerald-400 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">AFTER</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Blocks/Week', ai.blocks_per_week],
                ['Avg Duration', `${ai.avg_duration_hr}h`],
                ['Train Conflicts', ai.train_conflicts],
                ['Delay/Week', `${ai.delay_min} min`],
                ['Utilization', `${ai.utilization_pct}%`],
                ['Tasks/Block', `${ai.tasks_combined_per_block}x`],
              ].map(([l, v]) => (
                <div key={l} className="text-center p-3 bg-emerald-500/5 rounded-xl">
                  <div className="text-emerald-300 font-bold text-xl">{v}</div>
                  <div className="text-slate-400 text-xs mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Improvement Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {improvements.map(({ label, manual: m, ai: a, improvement, icon: Icon }) => (
          <div key={label} className="glass rounded-2xl border border-blue-900/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon size={16} className="text-blue-400" />
              <span className="text-slate-300 text-sm font-medium">{label}</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 text-center p-2 bg-red-500/5 rounded-xl">
                <div className="text-red-300 font-bold">{m}</div>
                <div className="text-slate-500 text-xs">Manual</div>
              </div>
              <ArrowLeftRight size={14} className="text-slate-500 flex-shrink-0" />
              <div className="flex-1 text-center p-2 bg-emerald-500/5 rounded-xl">
                <div className="text-emerald-300 font-bold">{a}</div>
                <div className="text-slate-500 text-xs">AI</div>
              </div>
            </div>
            <div className="text-center text-emerald-400 text-xs font-semibold bg-emerald-500/10 rounded-lg py-1">
              ✓ {improvement}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl border border-blue-900/30 p-5">
          <h3 className="text-white font-semibold mb-4">Side-by-Side Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="metric" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f1f3d', border: '1px solid #1e4080', borderRadius: 12, color: '#e2e8f0' }} />
              <Bar dataKey="manual" fill="#ef4444" name="Manual" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ai" fill="#10b981" name="AI-Optimized" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-2xl border border-blue-900/30 p-5">
          <h3 className="text-white font-semibold mb-4">Performance Radar</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e3a5f" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Radar name="Manual" dataKey="manual" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
              <Radar name="AI Optimized" dataKey="ai" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              <Tooltip contentStyle={{ background: '#0f1f3d', border: '1px solid #1e4080', borderRadius: 12, color: '#e2e8f0' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
