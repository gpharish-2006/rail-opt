export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend
}) {
  const colors = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      icon: 'text-blue-600',
      val: 'text-blue-700'
    },

    green: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      icon: 'text-emerald-600',
      val: 'text-emerald-700'
    },

    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      icon: 'text-amber-600',
      val: 'text-amber-700'
    },

    red: {
      bg: 'bg-red-50',
      border: 'border-red-100',
      icon: 'text-red-600',
      val: 'text-red-700'
    },

    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      icon: 'text-purple-600',
      val: 'text-purple-700'
    }
  }

  const c = colors[color] || colors.blue

  return (
    <div
      className="
        bg-white
        rounded-2xl
        p-5
        border
        border-slate-200
        shadow-sm
        hover:shadow-md
        hover:-translate-y-0.5
        transition-all
        duration-200
      "
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">

        {/* Icon */}
        <div
          className={`
            w-10
            h-10
            rounded-xl
            ${c.bg}
            flex
            items-center
            justify-center
          `}
        >
          <Icon
            size={20}
            className={c.icon}
          />
        </div>

        {/* Trend */}
        {trend !== undefined && (
          <span
            className={`
              text-xs
              font-medium
              px-2
              py-1
              rounded-full
              ${
                trend >= 0
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-red-50 text-red-600'
              }
            `}
          >
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      {/* Value */}
      <div
        className={`
          text-2xl
          font-bold
          mb-1
          ${c.val}
        `}
      >
        {value ?? '—'}
      </div>

      {/* Title */}
      <div className="text-slate-800 text-sm font-semibold">
        {title}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div className="text-slate-500 text-xs mt-0.5">
          {subtitle}
        </div>
      )}
    </div>
  )
}