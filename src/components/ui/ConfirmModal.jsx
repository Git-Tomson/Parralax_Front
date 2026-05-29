import { useEffect } from 'react';
import { AlertTriangle, Loader } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  isPending = false,
}) {
  // Fermeture par Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape' && !isPending) onCancel?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, isPending, onCancel]);

  // Bloque le scroll de la page
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const confirmCls = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
    : variant === 'warning'
    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20';

  const iconCls = variant === 'danger'
    ? 'bg-red-100 text-red-600'
    : variant === 'warning'
    ? 'bg-amber-100 text-amber-600'
    : 'bg-blue-100 text-blue-600';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !isPending) onCancel?.(); }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-[fadeInUp_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconCls}`}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-slate-500 text-sm mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-lg disabled:opacity-60 transition-all ${confirmCls}`}
          >
            {isPending && <Loader size={13} className="animate-spin" />}
            {isPending ? 'En cours…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
