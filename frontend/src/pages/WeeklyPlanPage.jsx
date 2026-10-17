import { useEffect, useState } from 'react'
import { generateWeeklyPlan, getWeeklyPlan } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import { DEPT_COLORS } from '../constants/colors'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Sparkles } from 'lucide-react'

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

function getBlockDate(block) {
  return String(block.date || block.start_time || '').slice(0, 10)
}

function getTimeWindow(block) {
  return block.time_window || `${block.start_time?.slice(11, 16) || '01:00'} – ${block.end_time?.slice(11, 16) || '05:00'}`
}

function consolidateBlocks(blocks) {
  const grouped = new Map()

  blocks.forEach(block => {
    const corridor = block.corridor_id || block.corridor_code || block.corridor_name || block.section_id || 'unknown'
    const key = `${getBlockDate(block)}|${corridor}|${getTimeWindow(block)}`
    const existing = grouped.get(key)
    if (existing) {
      existing.taskCount += Number(block.task_count) || block.assigned_tasks?.length || block.tasks?.length || 1
      existing.tasks.push(block)
      existing.is_mega_block = true
      return
    }

    grouped.set(key, {
      ...block,
      taskCount: Number(block.task_count) || block.assigned_tasks?.length || block.tasks?.length || 1,
      tasks: [block],
      is_mega_block: Boolean(block.is_mega_block || block.task_count > 1 || block.tasks?.length > 1),
    })
  })

  return [...grouped.values()].map(block => ({
    ...block,
    title: block.taskCount > 1 ? 'Mega-Block' : (block.title || block.block_name || block.block_code || 'Mega-Block'),
    corridorName: block.corridor_code || block.corridor_name || 'Indian Railways Mainline',
    timeWindow: getTimeWindow(block),
    kmRange: block.section_id || block.km_range || (block.km_start != null && block.km_end != null ? `KM ${block.km_start}-${block.km_end}` : 'KM 140-145'),
  }))
}

function calculateSummary(blocks) {
  return {
    total_line_blocks: blocks.length,
    approved_mega_blocks: blocks.filter(block => block.tasks?.length > 1 || block.task_count > 1 || block.is_mega_block).length,
    avg_priority_score: blocks.length
      ? (blocks.reduce((sum, block) => sum + (parseFloat(block.priority_score ?? block.crit ?? 75) || 75), 0) / blocks.length).toFixed(1)
      : '85.0',
    train_conflicts: 0,
  }
}

export default function WeeklyPlanPage() {
  const [weekStart, setWeekStart] = useState(fmt(getMonday()))
  const [weeklyBlocks, setWeeklyBlocks] = useState([])
  const [summary, setSummary] = useState(calculateSummary([]))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getWeeklyPlan(weekStart)
      .then(r => {
        const response = r?.data?.data || r?.data || {}
        const plans = Array.isArray(response) ? response : response.plans || []
        const megaBlocks = Array.isArray(response.mega_blocks) ? response.mega_blocks : []
        const blocks = megaBlocks.length ? megaBlocks.map(block => ({ ...block, is_mega_block: true })) : plans
        setWeeklyBlocks(blocks)
        setSummary(response.summary || calculateSummary(blocks))
      })
      .catch(() => {
        setWeeklyBlocks([])
        setSummary(calculateSummary([]))
      })
      .finally(() => setLoading(false))
  }, [weekStart])

  function changeWeek(delta) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + delta * 7)
    setWeekStart(fmt(d))
  }

  async function handleRunWeeklyAIPlanner() {
    setLoading(true)
    try {
      const response = await generateWeeklyPlan({ horizon: 'weekly', target_date: weekStart })
      const payload = response?.data?.data || response?.data || {}
      const generatedBlocks = Array.isArray(payload)
        ? payload
        : payload.schedule || payload.blocks || payload.schedule_json || payload.plans || []
      const blocks = generatedBlocks.map((block, index) => {
        const blockDate = String(block.date || '').slice(0, 10)
        const fallbackDate = weekDates[index % weekDates.length]
        const date = blockDate || fmt(fallbackDate)
        const dateIndex = weekDates.findIndex(day => fmt(day) === date)
        return {
          ...block,
          date,
          day_index: block.day_index ?? block.day_of_week ?? (dateIndex >= 0 ? dateIndex : index % 7),
          title: block.title || block.block_name || block.task_code || 'Mega-Block',
          time_window: block.time_window || `${block.start_time || '01:00'} - ${block.end_time || '05:00'}`,
        }
      })
      setWeeklyBlocks(blocks)
      setSummary(payload.summary || calculateSummary(blocks))
    } catch (err) {
      console.error('Failed to generate weekly plan:', err)
    } finally {
      setLoading(false)
    }
  }

  const weekDates = DAYS.map((_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const today = fmt(new Date())
  const weeklyDays = DAYS.map((_, dayIndex) => ({
    dayName: DAY_SHORT[dayIndex].toUpperCase(),
    dayNumber: weekDates[dayIndex].getDate(),
    dateString: fmt(weekDates[dayIndex]),
    dayIndex,
  }))

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
            {weeklyBlocks.length} Approved Line Possessions Scheduled
          </div>
        </div>

        <button
          onClick={handleRunWeeklyAIPlanner}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-lg shadow-sm transition-all"
        >
          {loading ? <span className="animate-spin">⏳</span> : <Sparkles size={16} />}
          {loading ? 'Optimizing Week...' : 'Run AI Weekly Planner'}
        </button>

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
          { l: 'Total Line Blocks', v: summary.total_line_blocks ?? weeklyBlocks.length },
          { l: 'Approved Mega-Blocks', v: summary.approved_mega_blocks ?? 0 },
          { l: 'Avg Priority Score', v: summary.avg_priority_score ?? '85.0' },
          { l: 'Train Conflicts', v: summary.train_conflicts ?? 0 },
        ].map(({ l, v }) => (
          <div key={l} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-center shadow-xs">
            <div className="text-slate-900 dark:text-white text-xl font-black font-mono">{v}</div>
            <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      {/* 7-Day Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weeklyDays.map(dayObj => {
          const dayBlocks = weeklyBlocks.filter(block => {
            const blockDate = getBlockDate(block)
            const blockDay = String(block.day_name || block.day || '').toUpperCase()
            return blockDate === dayObj.dateString || Number(block.day_index ?? block.day_of_week) === dayObj.dayIndex || blockDay.startsWith(dayObj.dayName)
          })
          const consolidatedDayBlocks = consolidateBlocks(dayBlocks)
          const dateStr = dayObj.dateString
          const isToday = dateStr === today

          return (
            <div
              key={dayObj.dateString}
              className={`bg-white dark:bg-slate-800 border rounded-xl min-h-48 flex flex-col shadow-xs ${
                isToday ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {/* Day Header */}
              <div className={`p-2.5 rounded-t-xl border-b border-slate-200 dark:border-slate-700 text-center ${isToday ? 'bg-blue-50 dark:bg-blue-950/60' : 'bg-slate-50 dark:bg-slate-900/60'}`}>
                <div className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{dayObj.dayName}</div>
                <div className={`text-base font-black ${isToday ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>
                  {dayObj.dayNumber}
                </div>
                {isToday && <div className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400">TODAY</div>}
              </div>

              {/* Day Block Schedule */}
              <div className="flex-1 p-2">
                {loading ? (
                  <div className="h-20 bg-slate-100 dark:bg-slate-700/50 rounded-lg animate-pulse" />
                ) : consolidatedDayBlocks.length > 0 ? (
                  consolidatedDayBlocks.map((block, blockIndex) => {
                    const departments = Array.isArray(block.merged_departments)
                      ? block.merged_departments
                      : String(block.departments || block.department || '').split(',').map(department => department.trim()).filter(Boolean)
                    const timeWindow = block.timeWindow
                    const taskCount = block.taskCount
                    const location = block.kmRange
                    return (
                      <div key={block.id ?? block.block_code ?? blockIndex} className="p-2.5 mb-2 last:mb-0 rounded-lg border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-xs space-y-1.5">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono font-extrabold text-emerald-800 dark:text-emerald-300 text-[11px] truncate">
                            {block.title}
                          </span>
                          <span className="bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-bold px-1 rounded text-[9px] flex-shrink-0">
                            {taskCount > 1 ? `${taskCount} Tasks Merged` : '1 Task'}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white">{block.corridorName}</div>
                        <div className="flex flex-wrap gap-1">
                          {departments.map(department => (
                            <span key={department} className="text-[10px] font-bold" style={{ color: DEPT_COLORS[department] || '#64748b' }}>
                              {department}
                            </span>
                          ))}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1 font-mono">
                          <Clock size={11} /> {timeWindow}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                          {location}
                        </div>
                        <div className="mt-1">
                          <StatusBadge status="Approved" label="Approved" showDot={false} />
                        </div>
                      </div>
                    )
                  })
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
