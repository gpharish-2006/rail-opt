const configs = {
  // Department Colors (Strict CRIS Standard)
  Engineering: 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800',
  TMS: 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800',
  'S&T': 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  SMMS: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  Traction: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800',
  TDMS: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800',
  'Mega-Block': 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',

  // Status Colors
  Critical: 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800',
  Urgent: 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800',
  High: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  Medium: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800',
  Low: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  Pending: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  Approved: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  Proposed: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800',
  Completed: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
}

const dots = {
  Engineering: 'bg-red-600 dark:bg-red-400',
  TMS: 'bg-red-600 dark:bg-red-400',
  'S&T': 'bg-amber-600 dark:bg-amber-400',
  SMMS: 'bg-amber-600 dark:bg-amber-400',
  Traction: 'bg-blue-600 dark:bg-blue-400',
  TDMS: 'bg-blue-600 dark:bg-blue-400',
  'Mega-Block': 'bg-emerald-600 dark:bg-emerald-400',
  Critical: 'bg-red-600 dark:bg-red-400',
  Urgent: 'bg-red-600 dark:bg-red-400',
  High: 'bg-amber-600 dark:bg-amber-400',
  Medium: 'bg-blue-600 dark:bg-blue-400',
  Pending: 'bg-amber-600 dark:bg-amber-400',
  Approved: 'bg-emerald-600 dark:bg-emerald-400',
  Proposed: 'bg-blue-600 dark:bg-blue-400',
}

export default function StatusBadge({ status, showDot = true, label }) {
  const cls = configs[status] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
  const dot = dots[status] || 'bg-slate-500'
  const text = label || status

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border ${cls}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      {text}
    </span>
  )
}
