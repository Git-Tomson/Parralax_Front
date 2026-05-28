export default function ProgressBar({ percent = 0, failed = false, showLabel = false }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const gradient = failed
    ? 'from-red-500 to-red-600'
    : clamped === 100
    ? 'from-emerald-400 to-emerald-500'
    : 'from-blue-400 to-blue-600';

  return (
    <div>
      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-500 mt-0.5 block">{clamped.toFixed(0)}%</span>
      )}
    </div>
  );
}
