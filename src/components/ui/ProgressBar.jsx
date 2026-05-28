export default function ProgressBar({ percent = 0, failed = false }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
      <div
        className={`h-full rounded transition-all ${failed ? 'bg-[#dc2626]' : 'bg-black'}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
