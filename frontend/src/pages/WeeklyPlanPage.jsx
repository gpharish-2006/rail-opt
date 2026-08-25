import { useEffect, useState } from 'react'
import { getWeeklyPlan } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Train, Layers } from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getMonday(d = new Date()) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  return date
}

function fmt(date) {
  return date.toISOString().slice(0, 10)
}

export default function WeeklyPlanPage() {
  const [weekStart, setWeekStart] = useState(fmt(getMonday()))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getWeeklyPlan(weekStart)
      .then(r => setData(r.data))
      .catch(() => {
        // Fallback mock data
        setData({
          plans: [
            { id: 1, day_of_week: 0, block_code: 'MB-2026-081', corridor_code: 'NDLS-AGR', corridor_name: 'Delhi-Agra', start_time: '2026-08-24 01:00', end_time: '2026-08-24 05:00', departments: 'Engineering, S&T, Traction', block_status: 'Approved', priority_score: 94, block_utilization: 96, train_conflicts: 0 },
            { id: 2, day_of_week: 2, block_code: 'MB-2026-083', corridor_code: 'HWH-PRYJ', corridor_name: 'Howrah-Prayagraj', start_time: '2026-08-26 02:00', end_time: '2026-08-26 06:00', departments: 'Engineering, S&T', block_status: 'Approved', priority_score: 91, block_utilization: 92, train_conflicts: 1 },
            { id: 3, day_of_week: 4, block_code: 'SB-2026-085', corridor_code: 'CSTM-PNVL', corridor_name: 'Mumbai Suburban', start_time: '2026-08-28 00:30', end_time: '2026-08-28 04:30', departments: 'Traction, Engineering', block_status: 'Proposed', priority_score: 88, block_utilization: 89, train_conflicts: 0 },
          ],
        })
      })
      .finally(() => setLoading(false))
  }, [weekStart])

  function changeWeek(delta) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + delta * 7)
    setWeekStart(fmt(d))
  }

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
      {/* Week Navigator Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 shadow-xs">
        <button
          onClick={() => changeWeek(-1)}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white transition-all"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="text-center">
          <div className="text-slate-900 dark:text-white font-extrabold text-base flex items-center justify-center gap-2">
            <CalendarDays size={20} className="text-blue-600 dark:text-blue-400" />
            Week of {new Date(weekStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-0.5">
            {data?.plans?.length || 0} Approved Line Possessions Scheduled
          </div>
        </div>

        <button
          onClick={() => changeWeek(1)}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white transition-all"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Week Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { l: 'Total Line Blocks', v: data?.plans?.length || 0 },
          { l: 'Approved Mega-Blocks', v: data?.plans?.filter(p => p.block_status === 'Approved').length || 0 },
          { l: 'Avg Priority Score', v: data?.plans?.length ? Math.round(data.plans.reduce((s, p) => s + (p.priority_score || 0), 0) / data.plans.length) : '—' },
          { l: 'Train Conflicts', v: data?.plans?.reduce((s, p) => s + (p.train_conflicts || 0), 0) || 0 },
        ].map(({ l, v }) => (
          <div key={l} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-center shadow-xs">
            <div className="text-slate-900 dark:text-white text-xl font-black font-mono">{v}</div>
            <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      {/* 7-Day Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {DAYS.map((day, i) => {
          const plan = dayMap[i]
          const dateStr = fmt(weekDates[i])
          const isToday = dateStr === today

          return (
            <div
              key={day}
              className={`bg-white dark:bg-slate-800 border rounded-xl min-h-48 flex flex-col shadow-xs ${
                isToday ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {/* Day Header */}
              <div className={`p-2.5 rounded-t-xl border-b border-slate-200 dark:border-slate-700 text-center ${isToday ? 'bg-blue-50 dark:bg-blue-950/60' : 'bg-slate-50 dark:bg-slate-900/60'}`}>
                <div className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{DAY_SHORT[i]}</div>
                <div className={`text-base font-black ${isToday ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>
                  {weekDates[i].getDate()}
                </div>
                {isToday && <div className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400">TODAY</div>}
              </div>

              {/* Day Block Schedule */}
              <div className="flex-1 p-2">
                {loading ? (
                  <div className="h-20 bg-slate-100 dark:bg-slate-700/50 rounded-lg animate-pulse" />
                ) : plan ? (
                  <div className="p-2.5 rounded-lg border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-xs space-y-1.5">
                    <div className="font-mono font-extrabold text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-1">
                      <Layers size={12} /> {plan.block_code}
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white">{plan.corridor_code}</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1 font-mono">
                      <Clock size={11} /> {plan.start_time?.slice(11, 16)} – {plan.end_time?.slice(11, 16)}
                    </div>
                    <div className="mt-1">
                      <StatusBadge status={plan.block_status} showDot={false} />
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-[11px] font-medium text-center p-2">
                    No block
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
