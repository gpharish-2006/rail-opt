import { useEffect, useState } from 'react'
import { getWeeklyPlan } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Train } from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getMonday(d = new Date()) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date
}

function fmt(date) { return date.toISOString().slice(0, 10) }

export default function WeeklyPlanPage() {
  const [weekStart, setWeekStart] = useState(fmt(getMonday()))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getWeeklyPlan(weekStart).then(r => setData(r.data)).finally(() => setLoading(false))
  }, [weekStart])

  function changeWeek(delta) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + delta * 7)
    setWeekStart(fmt(d))
  }

  // Build day map
  const dayMap = {}
  data?.plans?.forEach(p => {
    dayMap[p.day_of_week] = p
  })

  const weekDates = DAYS.map((_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const today = fmt(new Date())

  return (
    <div className="space-y-5">
      {/* Week Navigator */}
      <div className="flex items-center justify-between glass rounded-2xl px-5 py-4 border border-blue-900/30">
        <button onClick={() => changeWeek(-1)}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <div className="text-white font-bold text-lg flex items-center gap-2">
            <CalendarDays size={18} className="text-blue-400" />
            Week of {new Date(weekStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div className="text-slate-400 text-sm">{data?.plans?.length || 0} blocks scheduled this week</div>
        </div>
        <button onClick={() => changeWeek(1)}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Week Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { l: 'Total Blocks', v: data?.plans?.length || 0 },
          { l: 'Approved', v: data?.plans?.filter(p => p.block_status === 'Approved').length || 0 },
          { l: 'Avg Priority', v: data?.plans?.length ? Math.round(data.plans.reduce((s, p) => s + (p.priority_score || 0), 0) / data.plans.length) : '—' },
          { l: 'Total Conflicts', v: data?.plans?.reduce((s, p) => s + (p.train_conflicts || 0), 0) || 0 },
        ].map(({ l, v }) => (
          <div key={l} className="glass rounded-xl p-4 border border-blue-900/30 text-center">
            <div className="text-white text-2xl font-bold">{v}</div>
            <div className="text-slate-400 text-xs mt-1">{l}</div>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3">
        {DAYS.map((day, i) => {
          const plan = dayMap[i]
          const dateStr = fmt(weekDates[i])
          const isToday = dateStr === today
          return (
            <div key={day} className={`glass rounded-2xl border min-h-40 flex flex-col ${
              isToday ? 'border-blue-500/50 glow-blue' : 'border-blue-900/30'
            }`}>
              {/* Day Header */}
              <div className={`p-3 rounded-t-2xl border-b border-blue-900/20 ${isToday ? 'bg-blue-600/20' : 'bg-white/3'}`}>
                <div className="text-xs font-bold text-slate-400 uppercase">{DAY_SHORT[i]}</div>
                <div className={`text-lg font-bold mt-0.5 ${isToday ? 'text-blue-300' : 'text-white'}`}>
                  {weekDates[i].getDate()}
                </div>
                {isToday && <div className="text-blue-400 text-xs">Today</div>}
              </div>

              {/* Block */}
              <div className="flex-1 p-2">
                {loading ? (
                  <div className="h-20 bg-white/5 rounded-xl animate-pulse" />
                ) : plan ? (
                  <div className={`p-2.5 rounded-xl h-full border ${
                    plan.block_status === 'Approved'
                      ? 'bg-emerald-600/10 border-emerald-500/30'
                      : 'bg-blue-600/10 border-blue-500/30'
                  }`}>
                    <div className="font-mono text-xs text-blue-300 mb-1">{plan.block_code}</div>
                    <div className="text-white text-xs font-semibold mb-1">{plan.corridor_code}</div>
                    <div className="text-slate-400 text-xs flex items-center gap-1 mb-1">
                      <Clock size={10} />
                      {plan.start_time?.slice(11, 16)} – {plan.end_time?.slice(11, 16)}
                    </div>
                    {plan.departments?.split(',').map(d => (
                      <div key={d} className="text-xs text-slate-300 truncate">{d.trim()}</div>
                    ))}
                    <div className="mt-1.5">
                      <StatusBadge status={plan.block_status} showDot={false} />
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-xs">
                      <Train size={10} className="text-amber-400" />
                      <span className="text-amber-400">{plan.train_conflicts}</span>
                      <span className="text-emerald-400 ml-2">{plan.block_utilization}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-600 text-xs text-center p-2">
                    No block scheduled
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Block List */}
      {data?.plans?.length > 0 && (
        <div className="glass rounded-2xl border border-blue-900/30 p-5">
          <h3 className="text-white font-semibold mb-4">Block Details</h3>
          <div className="space-y-3">
            {data.plans.map(p => (
              <div key={p.id} className="flex items-center gap-4 p-4 bg-white/3 rounded-xl hover:bg-white/5 transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
                  <CalendarDays size={20} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{p.block_code}</span>
                    <StatusBadge status={p.block_status} />
                  </div>
                  <div className="text-slate-400 text-sm mt-0.5">
                    {DAYS[p.day_of_week]} · {p.corridor_code} – {p.corridor_name}
                  </div>
                  <div className="text-slate-500 text-xs mt-0.5">
                    {p.start_time?.slice(0, 16)} – {p.end_time?.slice(11, 16)} · {p.departments}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-bold">{p.priority_score}</div>
                  <div className="text-slate-500 text-xs">Priority</div>
                </div>
                <div className="text-right">
                  <div className="text-blue-400 font-bold">{p.block_utilization}%</div>
                  <div className="text-slate-500 text-xs">Util.</div>
                </div>
                <div className="text-right">
                  <div className="text-amber-400 font-bold">{p.train_conflicts}</div>
                  <div className="text-slate-500 text-xs">Conflicts</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
