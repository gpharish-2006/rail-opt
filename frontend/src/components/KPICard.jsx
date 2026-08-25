export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
  badgeText
}) {
  const colorMap = {
    blue: {
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
      valColor: 'text-blue-700 dark:text-blue-300',
      borderAccent: 'border-l-4 border-l-blue-600',
    },
    green: {
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      valColor: 'text-emerald-700 dark:text-emerald-300',
      borderAccent: 'border-l-4 border-l-emerald-600',
    },
    amber: {
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
      valColor: 'text-amber-700 dark:text-amber-300',
      borderAccent: 'border-l-4 border-l-amber-500',
    },
    red: {
      iconBg: 'bg-red-100 dark:bg-red-900/40',
      iconColor: 'text-red-600 dark:text-red-400',
      valColor: 'text-red-700 dark:text-red-300',
      borderAccent: 'border-l-4 border-l-red-600',
    },
    purple: {
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      iconColor: 'text-purple-600 dark:text-purple-400',
      valColor: 'text-purple-700 dark:text-purple-300',
      borderAccent: 'border-l-4 border-l-purple-600',
    },
  }

  const c = colorMap[color] || colorMap.blue

  return (
    <div
      className={`
        bg-white dark:bg-slate-800
        border border-slate-200 dark:border-slate-700
        ${c.borderAccent}
        rounded-xl
        p-4
        shadow-xs hover:shadow-sm
        transition-all duration-200
        flex flex-col justify-between
      `}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className={`w-8 h-8 rounded-lg ${c.iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} className={c.iconColor} />
            </div>
          )}
          <span className="text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wide">
            {title}
          </span>
        </div>

        {badgeText && (
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
            {badgeText}
          </span>
        )}

        {trend !== undefined && !badgeText && (
          <span
            className={`
              text-[11px] font-bold px-2 py-0.5 rounded-full border
              ${
                trend >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
              }
            `}
          >
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div className="mt-1">
        <div className={`text-2xl font-black font-mono leading-none tracking-tight ${c.valColor}`}>
          {value ?? '—'}
        </div>

        {subtitle && (
          <div className="text-slate-500 dark:text-slate-400 text-[11px] font-medium mt-1 truncate">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  )
}