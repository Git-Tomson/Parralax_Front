export default function StatCard({ label, value, icon, color = 'blue', trend = null, sub = null }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',    border: 'border-blue-100',   icon: 'bg-blue-100 text-blue-600',   value: 'text-blue-700'   },
    green:  { bg: 'bg-emerald-50', border: 'border-emerald-100',icon: 'bg-emerald-100 text-emerald-600',value: 'text-emerald-700'},
    orange: { bg: 'bg-amber-50',   border: 'border-amber-100',  icon: 'bg-amber-100 text-amber-600', value: 'text-amber-700'  },
    red:    { bg: 'bg-red-50',     border: 'border-red-100',    icon: 'bg-red-100 text-red-600',     value: 'text-red-700'    },
    violet: { bg: 'bg-violet-50',  border: 'border-violet-100', icon: 'bg-violet-100 text-violet-600',value: 'text-violet-700'},
    slate:  { bg: 'bg-slate-50',   border: 'border-slate-100',  icon: 'bg-slate-100 text-slate-600', value: 'text-slate-700'  },
  };

  const c = colors[color] ?? colors.blue;

  return (
    <div className={`card-hover rounded-xl border ${c.bg} ${c.border} p-4 flex items-start gap-3`}>
      {icon && (
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${c.icon}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-slate-500 text-xs font-medium truncate">{label}</p>
        <p className={`text-2xl font-black mt-0.5 stat-value ${c.value}`}>
          {value ?? <span className="text-slate-300">—</span>}
        </p>
        {sub && <p className="text-slate-400 text-xs mt-0.5">{sub}</p>}
        {trend != null && (
          <p className={`text-xs mt-0.5 font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </p>
        )}
      </div>
    </div>
  );
}
