export default function Gauge({ value = 0, label = '', size = 80 }) {
  const pct = Math.min(1, Math.max(0, value));
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct * 0.75);

  const color =
    pct > 0.85 ? '#ef4444' : pct > 0.65 ? '#f59e0b' : '#10b981';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
          transform={`rotate(135 ${size / 2} ${size / 2})`}
        />
        {/* Value arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(135 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.7s ease, stroke 0.3s ease' }}
        />
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2 + 4}
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          fill={color}
        >
          {(pct * 100).toFixed(0)}%
        </text>
      </svg>
      {label && (
        <span className="text-xs text-slate-500 font-medium">{label}</span>
      )}
    </div>
  );
}
