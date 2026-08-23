import { useEffect, useState } from 'react'
import { getMaintenance, getCorridors, optimizeBlock, saveBlock } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import {
  Brain, Loader2, Zap, Train, Clock, CheckCircle2,
  AlertTriangle, ChevronDown, Info, RefreshCw, Check
} from 'lucide-react'

const DEPT_COLORS = { Engineering: 'text-blue-300', 'S&T': 'text-purple-300', Traction: 'text-amber-300' }

export default function BlockPlannerPage() {
  const [tasks, setTasks] = useState([])
  const [corridors, setCorridors] = useState([])
  const [selectedTasks, setSelectedTasks] = useState([])
  const [params, setParams] = useState({
    target_date: new Date().toISOString().slice(0, 10),
    corridor_id: '',
    time_window_start: '00:00',
    time_window_end: '23:59',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [showWhy, setShowWhy] = useState(false)

  useEffect(() => {
    Promise.all([getMaintenance({ status: 'Pending' }), getCorridors()])
      .then(([m, c]) => {
        setTasks(m.data)
        setCorridors(c.data)
      })
  }, [])

  async function handleOptimize() {
    setLoading(true)
    setResult(null)
    setError('')
    setSaved(false)
    try {
      const res = await optimizeBlock({
        target_date: params.target_date,
        corridor_id: params.corridor_id ? Number(params.corridor_id) : null,
        time_window_start: params.time_window_start,
        time_window_end: params.time_window_end,
        task_ids: selectedTasks.length ? selectedTasks : null,
      })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Optimization failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!result) return
    await saveBlock(result)
    setSaved(true)
  }

  function toggleTask(id) {
    setSelectedTasks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const critColor = (c) => c >= 9 ? 'text-red-400' : c >= 7 ? 'text-amber-400' : 'text-blue-400'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      {/* Left Panel: Task Selection + Parameters */}
      <div className="lg:col-span-2 space-y-4">
        {/* Parameters */}
        <div className="glass rounded-2xl p-5 border border-blue-900/30">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Brain size={16} className="text-blue-400" /> Optimization Parameters
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Target Date</label>
              <input type="date" value={params.target_date}
                onChange={e => setParams(p => ({ ...p, target_date: e.target.value }))}
                className="w-full bg-white/5 border border-blue-900/50 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Corridor (optional)</label>
              <select value={params.corridor_id}
                onChange={e => setParams(p => ({ ...p, corridor_id: e.target.value }))}
                className="w-full bg-[#0f1f3d] border border-blue-900/50 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                <option value="">All Corridors</option>
                {corridors.map(c => <option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Window Start</label>
                <input type="time" value={params.time_window_start}
                  onChange={e => setParams(p => ({ ...p, time_window_start: e.target.value }))}
                  className="w-full bg-white/5 border border-blue-900/50 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Window End</label>
                <input type="time" value={params.time_window_end}
                  onChange={e => setParams(p => ({ ...p, time_window_end: e.target.value }))}
                  className="w-full bg-white/5 border border-blue-900/50 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Task Selection */}
        <div className="glass rounded-2xl p-5 border border-blue-900/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              Maintenance Requests
              <span className="px-2 py-0.5 bg-blue-600/20 text-blue-300 text-xs rounded-full">{tasks.length}</span>
            </h3>
            {selectedTasks.length > 0 && (
              <button onClick={() => setSelectedTasks([])} className="text-slate-400 hover:text-white text-xs">Clear</button>
            )}
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {tasks.map(t => (
              <div key={t.id}
                onClick={() => toggleTask(t.id)}
                className={`p-3 rounded-xl cursor-pointer border transition-all ${
                  selectedTasks.includes(t.id)
                    ? 'bg-blue-600/20 border-blue-500/40'
                    : 'bg-white/3 border-blue-900/20 hover:bg-white/5'
                }`}>
                <div className="flex items-start gap-2">
                  <div className={`w-4 h-4 rounded mt-0.5 border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    selectedTasks.includes(t.id) ? 'bg-blue-600 border-blue-500' : 'border-slate-600'
                  }`}>
                    {selectedTasks.includes(t.id) && <Check size={10} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium truncate">{t.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs font-medium ${DEPT_COLORS[t.department] || 'text-slate-300'}`}>
                        {t.department}
                      </span>
                      <span className="text-slate-500 text-xs">·</span>
                      <span className="text-slate-400 text-xs">KM {t.km_start}</span>
                      <span className="text-slate-500 text-xs">·</span>
                      <span className={`text-xs font-bold ${critColor(t.criticality)}`}>{t.criticality}/10</span>
                    </div>
                  </div>
                  <div className="text-slate-400 text-xs flex-shrink-0">{t.duration_hours}h</div>
                </div>
              </div>
            ))}
          </div>
          {selectedTasks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-900/30 text-xs text-blue-400">
              {selectedTasks.length} task(s) selected for optimization
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleOptimize}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 text-white font-bold text-base rounded-2xl transition-all glow-blue flex items-center justify-center gap-3"
        >
          {loading
            ? <><Loader2 size={20} className="animate-spin" /> Optimizing...</>
            : <><Zap size={20} /> GENERATE OPTIMIZED BLOCK PLAN</>}
        </button>
      </div>

      {/* Right Panel: Result */}
      <div className="lg:col-span-3 space-y-4">
        {!result && !loading && !error && (
          <div className="glass rounded-2xl border border-blue-900/30 flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-blue-600/10 flex items-center justify-center mb-4">
              <Brain size={40} className="text-blue-400" />
            </div>
            <h3 className="text-white font-semibold text-xl mb-2">AI Block Planner Ready</h3>
            <p className="text-slate-400 max-w-sm text-sm">
              Select maintenance tasks and configure parameters, then click <strong className="text-white">Generate Optimized Block Plan</strong> to get an AI recommendation.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              {[
                ['35%', 'Criticality'],
                ['25%', 'Urgency'],
                ['20%', 'Safety Risk'],
              ].map(([v, l]) => (
                <div key={l} className="p-3 bg-white/5 rounded-xl">
                  <div className="text-blue-400 font-bold text-lg">{v}</div>
                  <div className="text-slate-400 text-xs">{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="glass rounded-2xl border border-red-500/30 p-6 text-center">
            <AlertTriangle className="mx-auto text-red-400 mb-3" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {loading && (
          <div className="glass rounded-2xl border border-blue-500/30 flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin mb-4" />
            <p className="text-blue-300 font-medium">Running optimization algorithm...</p>
            <div className="mt-4 space-y-2 text-sm text-slate-400 text-left">
              {[
                'Scoring maintenance tasks...',
                'Grouping by proximity & corridor...',
                'Scanning train timetables...',
                'Evaluating conflict-free windows...',
                'Selecting optimal block...',
              ].map(s => <div key={s} className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />{s}</div>)}
            </div>
          </div>
        )}

        {result && !loading && (
          <>
            {/* Main Recommendation Card */}
            <div className="glass rounded-2xl border border-emerald-500/30 p-6 glow-green">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <h3 className="text-white font-bold text-lg">Optimized Block Recommendation</h3>
                <span className="ml-auto px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">
                  AI GENERATED
                </span>
              </div>

              {/* Corridor + Time */}
              <div className="bg-gradient-to-r from-blue-600/20 to-emerald-600/10 rounded-xl p-5 mb-4 border border-blue-500/20">
                <div className="text-blue-300 text-sm font-medium mb-1">CORRIDOR {result.corridor_code}</div>
                <div className="text-white text-2xl font-bold mb-1">{result.corridor_name}</div>
                <div className="text-emerald-300 text-lg font-semibold">{result.window_label}</div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {result.departments?.map(d => (
                    <span key={d} className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      d === 'Engineering' ? 'bg-blue-600/20 text-blue-300 border-blue-500/30' :
                      d === 'S&T' ? 'bg-purple-600/20 text-purple-300 border-purple-500/30' :
                      'bg-amber-600/20 text-amber-300 border-amber-500/30'
                    }`}>{d}</span>
                  ))}
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {[
                  { l: 'Activities Combined', v: result.activities_combined, color: 'text-blue-400' },
                  { l: 'Priority Score', v: `${result.priority_score}/100`, color: 'text-emerald-400' },
                  { l: 'Train Conflicts', v: result.train_conflicts, color: result.train_conflicts > 2 ? 'text-red-400' : 'text-amber-400' },
                  { l: 'Estimated Delay', v: `${result.estimated_delay_min} min`, color: 'text-amber-400' },
                  { l: 'Block Duration', v: `${result.duration_hours}h`, color: 'text-blue-400' },
                  { l: 'Block Utilization', v: `${result.block_utilization}%`, color: 'text-emerald-400' },
                  { l: 'Dept Coordinated', v: result.departments?.length, color: 'text-purple-400' },
                  { l: 'Time Window', v: result.time_slot_label?.split('–')[0]?.trim(), color: 'text-slate-300' },
                ].map(({ l, v, color }) => (
                  <div key={l} className="bg-white/5 rounded-xl p-3 text-center">
                    <div className={`text-lg font-bold ${color}`}>{v}</div>
                    <div className="text-slate-400 text-xs mt-0.5">{l}</div>
                  </div>
                ))}
              </div>

              {/* Tasks in this block */}
              <div className="mb-4">
                <h4 className="text-slate-300 text-sm font-medium mb-2">Tasks in this Block</h4>
                <div className="space-y-2">
                  {result.tasks?.map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-2.5 bg-white/3 rounded-xl">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${critColor(t.criticality).replace('text', 'bg')}`} />
                      <div className="flex-1">
                        <div className="text-white text-sm">{t.title}</div>
                        <div className="text-slate-400 text-xs">{t.department} · KM {t.km_start}–{t.km_end} · {t.duration_hours}h</div>
                      </div>
                      <StatusBadge status={t.department} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button onClick={handleSave} disabled={saved}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
                  {saved ? <><CheckCircle2 size={16} /> Block Saved</> : <><Check size={16} /> Approve Block</>}
                </button>
                <button onClick={handleOptimize}
                  className="flex-1 py-2.5 border border-blue-500/30 text-blue-300 hover:bg-blue-600/20 rounded-xl font-medium transition-all flex items-center justify-center gap-2">
                  <RefreshCw size={16} /> Regenerate
                </button>
                <button onClick={() => setShowWhy(v => !v)}
                  className="px-4 py-2.5 border border-slate-600/40 text-slate-400 hover:text-white rounded-xl transition-all flex items-center gap-2">
                  <Info size={16} /> Why?
                </button>
              </div>
            </div>

            {/* Why This Block Explanation */}
            {showWhy && (
              <div className="glass rounded-2xl border border-blue-900/30 p-5">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Info size={16} className="text-blue-400" /> Why This Block?
                </h4>
                <div className="space-y-2">
                  {result.explanation?.map((e, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white/3 rounded-xl">
                      <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs flex-shrink-0 font-bold">
                        {i + 1}
                      </div>
                      <p className="text-slate-300 text-sm">{e}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
