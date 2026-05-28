import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, total, perPage, onChange }) {
  if (!pages || pages <= 1) return null;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const pageNums = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (p) => Math.abs(p - page) <= 2
  );

  return (
    <div className="flex items-center justify-between text-sm text-slate-500">
      <span className="text-xs">
        <span className="font-semibold text-slate-700">{from}–{to}</span> sur {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={12} />
          Préc.
        </button>
        {pageNums.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors ${
              p === page
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Suiv.
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}
