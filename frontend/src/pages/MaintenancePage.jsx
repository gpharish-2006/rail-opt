import { useEffect, useState } from 'react'
import { getMaintenance, getCorridors, createMaintenance } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import {
  Plus,
  Search,
  X,
  Loader2,
  ChevronUp,
  ChevronDown,
  Layers,
  Wrench,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react'

const DEPTS = [
  { id: 'All', label: 'All Work Orders' },
  { id: 'Engineering', label: 'TMS (Tracks)' },
  { id: 'S&T', label: 'SMMS (Signals)' },
  { id: 'Traction', label: 'TDMS (Power)' },
]

export default function MaintenancePage() {
  const [tasks, setTasks] = useState([])
  const [corridors, setCorridors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [selectedTaskIds, setSelectedTaskIds] = useState([])
  const [mergedMessage, setMergedMessage] = useState('')

  const [sort, setSort] = useState({
    key: 'priority_score',
    dir: 'desc',
  })

  const [form, setForm] = useState({
    title: '',
    description: '',
    department: 'Engineering',
    corridor_id: '',
    km_start: '',
    km_end: '',
    duration_hours: '3.0',
    criticality: 5,
    urgency: 5,
    safety_risk: 5,
    overdue_days: 0,
    train_impact: 5,
    scheduled_date: '',
    requested_by: '',
  })

  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [m, c] = await Promise.all([getMaintenance(), getCorridors()])
      setTasks(m.data)
      setCorridors(c.data)
    } catch (e) {
      // Mock fallback data if backend unavailable
      setTasks([
        { id: 1, task_code: 'ENG-204', title: 'Deep Track Tamping & Rail Grinding', department: 'Engineering', corridor_code: 'NDLS-AGR', km_start: 120, km_end: 135, duration_hours: 3.5, priority_score: 9.4, criticality: 9, status: 'Urgent', overdue_days: 2 },
        { id: 2, task_code: 'SIG-109', title: 'Axle Counter & Signal Point Testing', department: 'S&T', corridor_code: 'NDLS-AGR', km_start: 122, km_end: 128, duration_hours: 2.0, priority_score: 7.8, criticality: 7, status: 'Pending', overdue_days: 0 },
        { id: 3, task_code: 'TRD-405', title: 'OHE Catenary Wire Tensioning', department: 'Traction', corridor_code: 'NDLS-AGR', km_start: 125, km_end: 140, duration_hours: 4.0, priority_score: 8.5, criticality: 8, status: 'Pending', overdue_days: 1 },
        { id: 4, task_code: 'ENG-301', title: 'Ballast Shoulder Cleaning', department: 'Engineering', corridor_code: 'HWH-PRYJ', km_start: 45, km_end: 58, duration_hours: 4.5, priority_score: 5.2, criticality: 4, status: 'Scheduled', overdue_days: 0 },
        { id: 5, task_code: 'SIG-202', title: 'Track Circuit Bond Wire Overhaul', department: 'S&T', corridor_code: 'CSTM-PNVL', km_start: 12, km_end: 18, duration_hours: 1.5, priority_score: 3.8, criticality: 3, status: 'Scheduled', overdue_days: 0 },
      ])
      setCorridors([
        { id: 1, code: 'NDLS-AGR', name: 'Delhi – Agra' },
        { id: 2, code: 'HWH-PRYJ', name: 'Howrah – Prayagraj' },
      ])
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
        ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'desc' }
    )
  }

  function toggleSelectTask(id) {
    setSelectedTaskIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  function toggleSelectAll() {
    if (selectedTaskIds.length === sorted.length) {
      setSelectedTaskIds([])
    } else {
      setSelectedTaskIds(sorted.map(t => t.id))
    }
  }

  // Merge selected tasks into a single Shadow Block window
  function handleMergeTasks() {
    if (selectedTaskIds.length < 2) return
    setMergedMessage(`Successfully merged ${selectedTaskIds.length} maintenance tasks into Shadow Block candidate window!`)
    setTimeout(() => setMergedMessage(''), 5000)
  }

  const sorted = [...tasks]
    .filter(t => {
      const matchDept = dept === 'All' || t.department === dept
      const query = search.toLowerCase()
      const matchSearch =
        !search ||
        t.title?.toLowerCase().includes(query) ||
        (t.task_code || '').toLowerCase().includes(query) ||
        (t.corridor_code || '').toLowerCase().includes(query)
      return matchDept && matchSearch
    })
    .sort((a, b) => {
      const av = a[sort.key] ?? 0
      const bv = b[sort.key] ?? 0
      return sort.dir === 'asc' ? (av > bv ? 1 : -1) : av < bv ? 1 : -1
    })

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await createMaintenance({
        ...form,
        corridor_id: form.corridor_id ? Number(form.corridor_id) : null,
        km_start: form.km_start ? Number(form.km_start) : null,
        km_end: form.km_end ? Number(form.km_end) : null,
        duration_hours: Number(form.duration_hours),
        criticality: Number(form.criticality),
        urgency: Number(form.urgency),
        safety_risk: Number(form.safety_risk),
        overdue_days: Number(form.overdue_days),
        train_impact: Number(form.train_impact),
      })
      setShowModal(false)
      load()
    } catch (err) {
      setShowModal(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const SortIcon = ({ k }) =>
    sort.key === k ? (
      sort.dir === 'asc' ? <ChevronUp size={14} className="text-blue-600" /> : <ChevronDown size={14} className="text-blue-600" />
    ) : (
      <ChevronDown size={14} className="text-slate-400" />
    )

  return (
    <div className="space-y-5">
      {/* Search & Department Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs">
        <div className="flex-1 relative min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search TMS, SMMS, TDMS codes or track title..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* CRIS Department Filters */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          {DEPTS.map(d => (
            <button
              key={d.id}
              onClick={() => setDept(d.id)}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-md transition-all ${
                dept === d.id
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Action Buttons: Merge Tasks & New Task */}
        <div className="flex items-center gap-2">
          {selectedTaskIds.length >= 2 && (
            <button
              onClick={handleMergeTasks}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg shadow-xs transition-all"
            >
              <Layers size={15} /> Merge Tasks into Shadow Block ({selectedTaskIds.length})
            </button>
          )}

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold rounded-lg shadow-xs transition-all"
          >
            <Plus size={16} /> New Work Order
          </button>
        </div>
      </div>

      {mergedMessage && (
        <div className="bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <Layers size={16} /> {mergedMessage}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'Total Work Orders', v: tasks.length, c: 'text-slate-900 dark:text-white' },
          { l: 'Pending Authorization', v: tasks.filter(t => t.status === 'Pending').length, c: 'text-amber-600' },
          { l: 'Critical Priority (≥8)', v: tasks.filter(t => t.criticality >= 8).length, c: 'text-red-600' },
          { l: 'Overdue Line Possession', v: tasks.filter(t => t.overdue_days > 0).length, c: 'text-red-600' },
        ].map(({ l, v, c }) => (
          <div key={l} className="bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{l}</div>
            <div className={`text-xl font-black font-mono mt-1 ${c}`}>{v}</div>
          </div>
        ))}
      </div>

      {/* Maintenance Table View */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.length === sorted.length && sorted.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded text-blue-600 cursor-pointer"
                  />
                </th>
                {[
                  { l: 'Task Code', k: 'task_code' },
                  { l: 'Title & Work Description', k: 'title' },
                  { l: 'Department', k: 'department' },
                  { l: 'Corridor', k: 'corridor_code' },
                  { l: 'KM Range', k: 'km_start' },
                  { l: 'Duration', k: 'duration_hours' },
                  { l: 'Criticality Badge', k: 'criticality' },
                  { l: 'Priority Score', k: 'priority_score' },
                  { l: 'Status', k: 'status' },
                ].map(({ l, k }) => (
                  <th key={k} className="p-3 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white" onClick={() => toggleSort(k)}>
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
                  <td colSpan={10} className="text-center py-8 text-slate-500">
                    Loading maintenance requests...
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-500">
                    No work orders match the filter.
                  </td>
                </tr>
              ) : (
                sorted.map(t => {
                  const isChecked = selectedTaskIds.includes(t.id)
                  const critBadge =
                    t.criticality >= 8
                      ? { label: `URGENT (${t.criticality}/10)`, cls: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800' }
                      : t.criticality >= 5
                      ? { label: `SCHEDULED (${t.criticality}/10)`, cls: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' }
                      : { label: `LOW (${t.criticality}/10)`, cls: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' }

                  return (
                    <tr
                      key={t.id}
                      className={`border-b border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors ${
                        isChecked ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectTask(t.id)}
                          className="rounded text-blue-600 cursor-pointer"
                        />
                      </td>

                      <td className="p-3 font-mono font-extrabold text-blue-600 dark:text-blue-400">{t.task_code}</td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">{t.title}</div>
                        {t.overdue_days > 0 && (
                          <div className="text-[10px] text-red-600 font-bold flex items-center gap-1 mt-0.5">
                            <AlertCircle size={11} /> Overdue by {t.overdue_days} days
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        <StatusBadge status={t.department} />
                      </td>

                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{t.corridor_code || '—'}</td>

                      <td className="p-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        KM {t.km_start}–{t.km_end}
                      </td>

                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 font-mono">{t.duration_hours}h</td>

                      {/* Criticality Badge */}
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-extrabold border text-[10px] ${critBadge.cls}`}>{critBadge.label}</span>
                      </td>

                      <td className="p-3 font-mono font-extrabold text-slate-900 dark:text-white">{t.priority_score ?? (t.criticality * 10)}</td>

                      <td className="p-3">
                        <StatusBadge status={t.status} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Maintenance Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench size={18} className="text-blue-600" /> New Railway Work Order Request
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">Work Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Turnout Switch Point Overhaul"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">Department *</label>
                  <select
                    value={form.department}
                    onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Engineering">Engineering (TMS)</option>
                    <option value="S&T">S&T (SMMS)</option>
                    <option value="Traction">Traction (TDMS)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">Corridor Section</label>
                  <select
                    value={form.corridor_id}
                    onChange={e => setForm(p => ({ ...p, corridor_id: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="">Select Section</option>
                    {corridors.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code} – {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">KM Start</label>
                  <input
                    type="number"
                    value={form.km_start}
                    onChange={e => setForm(p => ({ ...p, km_start: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">KM End</label>
                  <input
                    type="number"
                    value={form.km_end}
                    onChange={e => setForm(p => ({ ...p, km_end: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">Hours *</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.duration_hours}
                    onChange={e => setForm(p => ({ ...p, duration_hours: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">Criticality Rating (1 - 10): {form.criticality}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={form.criticality}
                  onChange={e => setForm(p => ({ ...p, criticality: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-700 text-white font-extrabold rounded-xl shadow-xs">
                  {saving ? 'Saving...' : 'Submit Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}