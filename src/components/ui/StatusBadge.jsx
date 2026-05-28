const NODE_COLORS = {
  actif: 'bg-[#16a34a] text-white',
  surcharge: 'bg-[#ea580c] text-white',
  en_panne: 'bg-[#dc2626] text-white',
  en_maintenance: 'bg-gray-400 text-white',
  eteint: 'bg-black text-white',
};

const PROGRAMME_COLORS = {
  soumis: 'bg-gray-400 text-white',
  en_decomposition: 'bg-gray-200 text-gray-800',
  en_cours: 'bg-[#ea580c] text-white',
  termine: 'bg-[#16a34a] text-white',
  echec: 'bg-[#dc2626] text-white',
  annule: 'bg-black text-white',
};

const TASK_COLORS = {
  en_attente: 'bg-gray-300 text-gray-800',
  assignee: 'bg-[#ea580c] text-white',
  en_cours: 'bg-[#ea580c] text-white',
  terminee: 'bg-[#16a34a] text-white',
  echouee: 'bg-[#dc2626] text-white',
  migree: 'bg-gray-600 text-white',
};

const MAPS = { node: NODE_COLORS, programme: PROGRAMME_COLORS, task: TASK_COLORS };

export default function StatusBadge({ status, type = 'programme' }) {
  const map = MAPS[type] ?? PROGRAMME_COLORS;
  const cls = map[status] ?? 'bg-gray-200 text-gray-700';
  const isSpinning = type === 'programme' && status === 'en_decomposition';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {isSpinning && (
        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {status}
    </span>
  );
}
