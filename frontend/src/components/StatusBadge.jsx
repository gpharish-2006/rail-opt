const configs = {
  Critical: 'bg-red-500/15 text-red-300 border border-red-500/30',
  High:     'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  Medium:   'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  Low:      'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  Pending:  'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  Approved: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  Proposed: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  Completed:'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  Poor:     'bg-red-500/15 text-red-300 border border-red-500/30',
  Fair:     'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  Good:     'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  Engineering: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  'S&T':    'bg-purple-500/15 text-purple-300 border border-purple-500/30',
  Traction: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
}

const dots = {
  Critical: 'bg-red-400',
  High:     'bg-amber-400',
  Medium:   'bg-blue-400',
  Low:      'bg-slate-400',
  Pending:  'bg-amber-400',
  Approved: 'bg-emerald-400',
  Proposed: 'bg-blue-400',
  Completed:'bg-slate-400',
  Poor:     'bg-red-400',
  Fair:     'bg-amber-400',
  Good:     'bg-emerald-400',
}

export default function StatusBadge({ status, showDot = true }) {
  const cls = configs[status] || 'bg-slate-500/15 text-slate-300 border border-slate-500/30'
  const dot = dots[status] || 'bg-slate-400'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      {status}
    </span>
  )
}
