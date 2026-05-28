export default function MetricBar({ value = 0, label = '' }) {
  const pct = Math.min(1, Math.max(0, value));
  const color =
    pct > 0.85 ? 'bg-[#dc2626]' : pct > 0.65 ? 'bg-[#ea580c]' : 'bg-[#16a34a]';
  return (
    <div className="flex items-center gap-2 min-w-0">
      {label && <span className="text-xs text-gray-500 shrink-0">{label}</span>}
      <div className="flex-1 bg-gray-200 rounded h-1.5 overflow-hidden">
        <div
          className={`h-full rounded ${color} transition-all`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 shrink-0 w-10 text-right">
        {(pct * 100).toFixed(0)}%
      </span>
    </div>
  );
}
