const NODE_CONFIG = {
  actif:         { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', pulse: true,  label: 'Actif' },
  surcharge:     { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500',   pulse: true,  label: 'Surchargé' },
  en_panne:      { bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500',     pulse: false, label: 'En panne' },
  en_maintenance:{ bg: 'bg-slate-100',   text: 'text-slate-600',   border: 'border-slate-200',   dot: 'bg-slate-400',   pulse: false, label: 'Maintenance' },
  eteint:        { bg: 'bg-gray-100',    text: 'text-gray-500',    border: 'border-gray-200',    dot: 'bg-gray-400',    pulse: false, label: 'Éteint' },
};

const PROGRAMME_CONFIG = {
  soumis:           { bg: 'bg-slate-100', text: 'text-slate-600',  border: 'border-slate-200',  dot: 'bg-slate-400',   pulse: false, label: 'Soumis' },
  en_decomposition: { bg: 'bg-blue-100',  text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500',    pulse: true,  label: 'Décomposition' },
  en_cours:         { bg: 'bg-orange-100',text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500',  pulse: true,  label: 'En cours' },
  termine:          { bg: 'bg-emerald-100',text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-500', pulse: false, label: 'Terminé' },
  echec:            { bg: 'bg-red-100',   text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500',     pulse: false, label: 'Échec' },
  annule:           { bg: 'bg-gray-100',  text: 'text-gray-500',   border: 'border-gray-200',   dot: 'bg-gray-400',    pulse: false, label: 'Annulé' },
};

const TASK_CONFIG = {
  en_attente: { bg: 'bg-slate-100', text: 'text-slate-600',  border: 'border-slate-200',  dot: 'bg-slate-400',   pulse: false, label: 'En attente' },
  assignee:   { bg: 'bg-blue-100',  text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500',    pulse: true,  label: 'Assignée' },
  en_cours:   { bg: 'bg-orange-100',text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500',  pulse: true,  label: 'En cours' },
  terminee:   { bg: 'bg-emerald-100',text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-500',pulse: false, label: 'Terminée' },
  echouee:    { bg: 'bg-red-100',   text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500',     pulse: false, label: 'Échouée' },
  migree:     { bg: 'bg-violet-100',text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500',  pulse: false, label: 'Migrée' },
};

const MAPS = { node: NODE_CONFIG, programme: PROGRAMME_CONFIG, task: TASK_CONFIG };

const DEFAULT_CONFIG = {
  bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200',
  dot: 'bg-slate-400', pulse: false, label: null,
};

export default function StatusBadge({ status, type = 'programme' }) {
  const map = MAPS[type] ?? PROGRAMME_CONFIG;
  const cfg = map[status] ?? DEFAULT_CONFIG;

  const isDecomposition = type === 'programme' && status === 'en_decomposition';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {isDecomposition ? (
        <svg className="animate-spin h-2.5 w-2.5 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`}
        />
      )}
      <span>{cfg.label ?? status}</span>
    </span>
  );
}
