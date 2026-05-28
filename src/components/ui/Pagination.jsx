export default function Pagination({ page, pages, total, perPage, onChange }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
      <span>
        {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} sur {total}
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-100"
        >
          ← Préc.
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1)
          .filter((p) => Math.abs(p - page) <= 2)
          .map((p) => (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`px-3 py-1 border rounded ${
                p === page
                  ? 'bg-black text-white border-black'
                  : 'border-gray-300 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ))}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-100"
        >
          Suiv. →
        </button>
      </div>
    </div>
  );
}
