export default function MetricBar({ value = 0, label = '', showPercent = true, height = 'h-2' }) {
  const pct = Math.min(1, Math.max(0, value));
  const pctDisplay = (pct * 100).toFixed(0);

  const gradient =
    pct > 0.85
      ? 'from-red-500 to-red-600'
      : pct > 0.65
      ? 'from-amber-400 to-orange-500'
      : 'from-emerald-400 to-emerald-500';

  const textColor =
    pct > 0.85 ? 'text-red-600' : pct > 0.65 ? 'text-amber-600' : 'text-emerald-600';

  return (
    <div className="flex items-center gap-2 min-w-0 w-full">
      {label && <span className="text-xs text-slate-500 shrink-0 w-8">{label}</span>}
      <div className={`flex-1 bg-slate-200 rounded-full ${height} overflow-hidden`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} metric-fill transition-all duration-700`}
          style={{ width: `${pctDisplay}%` }}
        />
      </div>
      {showPercent && (
        <span className={`text-xs font-semibold shrink-0 w-9 text-right ${textColor}`}>
          {pctDisplay}%
        </span>
      )}
    </div>
  );
}
