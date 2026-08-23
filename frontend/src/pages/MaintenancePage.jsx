import { useEffect, useState } from 'react'
import { getMaintenance, getCorridors, createMaintenance } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import {
  Plus,
  Search,
  X,
  Loader2,
  ChevronUp,
  ChevronDown
} from 'lucide-react'

const DEPTS = ['All', 'Engineering', 'S&T', 'Traction']

export default function MaintenancePage() {
  const [tasks, setTasks] = useState([])
  const [corridors, setCorridors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [sort, setSort] = useState({
    key: 'priority_score',
    dir: 'desc'
  })

  const [form, setForm] = useState({
    title: '',
    description: '',
    department: 'Engineering',
    corridor_id: '',
    km_start: '',
    km_end: '',
    duration_hours: '',
    criticality: 5,
    urgency: 5,
    safety_risk: 5,
    overdue_days: 0,
    train_impact: 5,
    scheduled_date: '',
    requested_by: ''
  })

  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)

    try {
      const [m, c] = await Promise.all([
        getMaintenance(),
        getCorridors()
      ])

      setTasks(m.data)
      setCorridors(c.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function toggleSort(key) {
    setSort(s =>
      s.key === key
        ? {
            key,
            dir: s.dir === 'asc' ? 'desc' : 'asc'
          }
        : {
            key,
            dir: 'desc'
          }
    )
  }

  const sorted = [...tasks]
    .filter(t => {
      const matchDept =
        dept === 'All' || t.department === dept

      const query = search.toLowerCase()

      const matchSearch =
        !search ||
        t.title?.toLowerCase().includes(query) ||
        (t.task_code || '').toLowerCase().includes(query) ||
        (t.corridor_name || '').toLowerCase().includes(query)

      return matchDept && matchSearch
    })
    .sort((a, b) => {
      const av = a[sort.key] ?? 0
      const bv = b[sort.key] ?? 0

      return sort.dir === 'asc'
        ? av > bv ? 1 : -1
        : av < bv ? 1 : -1
    })

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)

    try {
      await createMaintenance({
        ...form,
        corridor_id: form.corridor_id
          ? Number(form.corridor_id)
          : null,
        km_start: form.km_start
          ? Number(form.km_start)
          : null,
        km_end: form.km_end
          ? Number(form.km_end)
          : null,
        duration_hours: Number(form.duration_hours),
        criticality: Number(form.criticality),
        urgency: Number(form.urgency),
        safety_risk: Number(form.safety_risk),
        overdue_days: Number(form.overdue_days),
        train_impact: Number(form.train_impact)
      })

      setShowModal(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const SortIcon = ({ k }) =>
    sort.key === k ? (
      sort.dir === 'asc' ? (
        <ChevronUp size={12} className="text-blue-500" />
      ) : (
        <ChevronDown size={12} className="text-blue-500" />
      )
    ) : (
      <ChevronDown size={12} className="text-slate-400" />
    )

  return (
    <div className="space-y-5">

      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div className="flex flex-wrap items-center gap-3">

        {/* Search */}
        <div className="flex-1 relative min-w-[220px]">

          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks, codes, corridors..."
            className="
              w-full
              pl-9
              pr-4
              py-2.5
              bg-white
              border
              border-slate-200
              rounded-xl
              text-slate-800
              placeholder-slate-400
              text-sm
              shadow-sm
              focus:outline-none
              focus:border-blue-400
              focus:ring-2
              focus:ring-blue-100
            "
          />
        </div>

        {/* Departments */}
        <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">

          {DEPTS.map(d => (
            <button
              key={d}
              onClick={() => setDept(d)}
              className={`
                px-3
                py-1.5
                text-xs
                font-medium
                rounded-lg
                transition-all
                ${
                  dept === d
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }
              `}
            >
              {d}
            </button>
          ))}

        </div>

        {/* New Task */}
        <button
          onClick={() => setShowModal(true)}
          className="
            flex
            items-center
            gap-2
            px-4
            py-2.5
            bg-blue-600
            hover:bg-blue-700
            text-white
            text-sm
            font-medium
            rounded-xl
            transition-all
            shadow-sm
          "
        >
          <Plus size={16} />
          New Task
        </button>

      </div>


      {/* =====================================================
          STATS
      ===================================================== */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        {[
          {
            l: 'Total',
            v: tasks.length,
            c: 'text-slate-800'
          },
          {
            l: 'Pending',
            v: tasks.filter(t => t.status === 'Pending').length,
            c: 'text-amber-600'
          },
          {
            l: 'Critical (≥8)',
            v: tasks.filter(t => t.criticality >= 8).length,
            c: 'text-red-600'
          },
          {
            l: 'Overdue',
            v: tasks.filter(t => t.overdue_days > 0).length,
            c: 'text-red-600'
          }
        ].map(({ l, v, c }) => (

          <div
            key={l}
            className="
              bg-white
              px-4
              py-3
              rounded-xl
              border
              border-slate-200
              shadow-sm
            "
          >
            <div className="text-slate-500 text-xs">
              {l}
            </div>

            <div className={`text-xl font-bold mt-1 ${c}`}>
              {v}
            </div>
          </div>

        ))}

      </div>


      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="
        bg-white
        rounded-2xl
        border
        border-slate-200
        shadow-sm
        overflow-hidden
      ">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead>

              <tr className="
                border-b
                border-slate-200
                text-slate-500
                text-xs
                uppercase
                tracking-wide
                bg-slate-50
              ">

                {[
                  { l: 'Code', k: 'task_code' },
                  { l: 'Title', k: 'title' },
                  { l: 'Dept', k: 'department' },
                  { l: 'Corridor', k: 'corridor_code' },
                  { l: 'KM Range', k: 'km_start' },
                  { l: 'Duration', k: 'duration_hours' },
                  { l: 'Priority', k: 'priority_score' },
                  { l: 'Criticality', k: 'criticality' },
                  { l: 'Status', k: 'status' }
                ].map(({ l, k }) => (

                  <th
                    key={k}
                    className="
                      px-4
                      py-3
                      text-left
                      cursor-pointer
                      hover:text-slate-800
                      transition-colors
                      select-none
                    "
                    onClick={() => toggleSort(k)}
                  >
                    <div className="flex items-center gap-1">
                      {l}
                      <SortIcon k={k} />
                    </div>
                  </th>

                ))}

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-12 text-slate-500"
                  >
                    Loading...
                  </td>
                </tr>

              ) : sorted.length === 0 ? (

                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-12 text-slate-500"
                  >
                    No tasks found
                  </td>
                </tr>

              ) : (

                sorted.map(t => (

                  <tr
                    key={t.id}
                    className="
                      border-b
                      border-slate-100
                      hover:bg-slate-50
                      transition-all
                    "
                  >

                    <td className="px-4 py-3 font-mono text-blue-600 text-xs">
                      {t.task_code}
                    </td>

                    <td className="px-4 py-3">

                      <div className="text-slate-800 font-medium">
                        {t.title}
                      </div>

                      <div className="
                        text-slate-500
                        text-xs
                        mt-0.5
                        truncate
                        max-w-xs
                      ">
                        {t.description?.slice(0, 60)}
                        {t.description ? '...' : ''}
                      </div>

                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={t.department} />
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {t.corridor_code || '—'}
                    </td>

                    <td className="
                      px-4
                      py-3
                      text-slate-600
                      font-mono
                      text-xs
                    ">
                      {t.km_start}–{t.km_end}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {t.duration_hours}h
                    </td>

                    <td className="px-4 py-3">

                      <div className="flex items-center gap-2">

                        <div className="
                          w-20
                          h-1.5
                          bg-slate-200
                          rounded-full
                          overflow-hidden
                        ">
                          <div
                            className="
                              h-full
                              rounded-full
                              bg-blue-500
                            "
                            style={{
                              width: `${(t.priority_score / 10) * 100}%`
                            }}
                          />
                        </div>

                        <span className="
                          text-slate-800
                          text-xs
                          font-medium
                        ">
                          {t.priority_score}
                        </span>

                      </div>

                    </td>

                    <td className="px-4 py-3">

                      <span
                        className={`
                          font-bold
                          text-xs
                          ${
                            t.criticality >= 9
                              ? 'text-red-600'
                              : t.criticality >= 7
                                ? 'text-amber-600'
                                : 'text-blue-600'
                          }
                        `}
                      >
                        {t.criticality}/10
                      </span>

                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* =====================================================
          NEW TASK MODAL
      ===================================================== */}

      {showModal && (

        <div className="
          fixed
          inset-0
          bg-slate-900/40
          backdrop-blur-sm
          flex
          items-center
          justify-center
          z-50
          p-4
        ">

          <div className="
            bg-white
            w-full
            max-w-2xl
            rounded-2xl
            border
            border-slate-200
            shadow-2xl
            max-h-[90vh]
            overflow-y-auto
          ">

            {/* Modal header */}

            <div className="
              flex
              items-center
              justify-between
              p-6
              border-b
              border-slate-200
            ">

              <div>
                <h2 className="
                  text-slate-800
                  font-semibold
                  text-lg
                ">
                  New Maintenance Task
                </h2>

                <p className="text-slate-500 text-xs mt-1">
                  Add a new railway maintenance task
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="
                  text-slate-400
                  hover:text-slate-700
                  hover:bg-slate-100
                  rounded-lg
                  p-2
                  transition-all
                "
              >
                <X size={20} />
              </button>

            </div>


            {/* Form */}

            <form
              onSubmit={handleSave}
              className="p-6 space-y-5"
            >

              <div className="grid grid-cols-2 gap-4">

                {/* Title */}

                <div className="col-span-2">

                  <label className="
                    text-slate-600
                    text-sm
                    mb-1
                    block
                    font-medium
                  ">
                    Title *
                  </label>

                  <input
                    required
                    value={form.title}
                    onChange={e =>
                      setForm(p => ({
                        ...p,
                        title: e.target.value
                      }))
                    }
                    className="
                      w-full
                      bg-white
                      border
                      border-slate-200
                      rounded-xl
                      px-4
                      py-2.5
                      text-slate-800
                      focus:outline-none
                      focus:border-blue-400
                      focus:ring-2
                      focus:ring-blue-100
                    "
                  />

                </div>


                {/* Department */}

                <div>

                  <label className="
                    text-slate-600
                    text-sm
                    mb-1
                    block
                    font-medium
                  ">
                    Department *
                  </label>

                  <select
                    value={form.department}
                    onChange={e =>
                      setForm(p => ({
                        ...p,
                        department: e.target.value
                      }))
                    }
                    className="
                      w-full
                      bg-white
                      border
                      border-slate-200
                      rounded-xl
                      px-4
                      py-2.5
                      text-slate-800
                      focus:outline-none
                      focus:border-blue-400
                      focus:ring-2
                      focus:ring-blue-100
                    "
                  >
                    <option>Engineering</option>
                    <option>S&T</option>
                    <option>Traction</option>
                  </select>

                </div>


                {/* Corridor */}

                <div>

                  <label className="
                    text-slate-600
                    text-sm
                    mb-1
                    block
                    font-medium
                  ">
                    Corridor
                  </label>

                  <select
                    value={form.corridor_id}
                    onChange={e =>
                      setForm(p => ({
                        ...p,
                        corridor_id: e.target.value
                      }))
                    }
                    className="
                      w-full
                      bg-white
                      border
                      border-slate-200
                      rounded-xl
                      px-4
                      py-2.5
                      text-slate-800
                      focus:outline-none
                      focus:border-blue-400
                      focus:ring-2
                      focus:ring-blue-100
                    "
                  >

                    <option value="">
                      Select Corridor
                    </option>

                    {corridors.map(c => (
                      <option
                        key={c.id}
                        value={c.id}
                      >
                        {c.code} – {c.name}
                      </option>
                    ))}

                  </select>

                </div>


                {/* Numeric fields */}

                {[
                  ['KM Start', 'km_start'],
                  ['KM End', 'km_end'],
                  ['Duration (hrs) *', 'duration_hours']
                ].map(([l, k]) => (

                  <div key={k}>

                    <label className="
                      text-slate-600
                      text-sm
                      mb-1
                      block
                      font-medium
                    ">
                      {l}
                    </label>

                    <input
                      type="number"
                      step="0.1"
                      value={form[k]}
                      onChange={e =>
                        setForm(p => ({
                          ...p,
                          [k]: e.target.value
                        }))
                      }
                      required={l.includes('*')}
                      className="
                        w-full
                        bg-white
                        border
                        border-slate-200
                        rounded-xl
                        px-4
                        py-2.5
                        text-slate-800
                        focus:outline-none
                        focus:border-blue-400
                        focus:ring-2
                        focus:ring-blue-100
                      "
                    />

                  </div>

                ))}


                {/* Date */}

                <div>

                  <label className="
                    text-slate-600
                    text-sm
                    mb-1
                    block
                    font-medium
                  ">
                    Scheduled Date
                  </label>

                  <input
                    type="date"
                    value={form.scheduled_date}
                    onChange={e =>
                      setForm(p => ({
                        ...p,
                        scheduled_date: e.target.value
                      }))
                    }
                    className="
                      w-full
                      bg-white
                      border
                      border-slate-200
                      rounded-xl
                      px-4
                      py-2.5
                      text-slate-800
                      focus:outline-none
                      focus:border-blue-400
                      focus:ring-2
                      focus:ring-blue-100
                    "
                  />

                </div>

              </div>


              {/* Sliders */}

              <div className="grid grid-cols-2 gap-4">

                {[
                  ['Criticality', 'criticality'],
                  ['Urgency', 'urgency'],
                  ['Safety Risk', 'safety_risk'],
                  ['Train Impact', 'train_impact']
                ].map(([l, k]) => (

                  <div key={k}>

                    <label className="
                      text-slate-600
                      text-sm
                      mb-1
                      flex
                      justify-between
                    ">

                      <span>{l}</span>

                      <span className="
                        text-blue-600
                        font-bold
                      ">
                        {form[k]}/10
                      </span>

                    </label>

                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={form[k]}
                      onChange={e =>
                        setForm(p => ({
                          ...p,
                          [k]: e.target.value
                        }))
                      }
                      className="w-full accent-blue-600"
                    />

                  </div>

                ))}

              </div>


              {/* Description */}

              <div>

                <label className="
                  text-slate-600
                  text-sm
                  mb-1
                  block
                  font-medium
                ">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={e =>
                    setForm(p => ({
                      ...p,
                      description: e.target.value
                    }))
                  }
                  rows={3}
                  className="
                    w-full
                    bg-white
                    border
                    border-slate-200
                    rounded-xl
                    px-4
                    py-2.5
                    text-slate-800
                    resize-none
                    focus:outline-none
                    focus:border-blue-400
                    focus:ring-2
                    focus:ring-blue-100
                  "
                />

              </div>


              {/* Buttons */}

              <div className="
                flex
                gap-3
                pt-2
              ">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="
                    flex-1
                    py-2.5
                    border
                    border-slate-200
                    text-slate-600
                    hover:bg-slate-50
                    rounded-xl
                    transition-all
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="
                    flex-1
                    py-2.5
                    bg-blue-600
                    hover:bg-blue-700
                    text-white
                    font-medium
                    rounded-xl
                    transition-all
                    flex
                    items-center
                    justify-center
                    gap-2
                  "
                >

                  {saving && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  Save Task

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  )
}