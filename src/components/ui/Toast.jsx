import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let idCounter = 0;

const ICONS = {
  success: <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />,
  error:   <XCircle size={16} className="text-red-400 shrink-0" />,
  info:    <Info size={16} className="text-blue-400 shrink-0" />,
};

const STYLES = {
  success: 'bg-slate-800 border-emerald-500/30',
  error:   'bg-slate-800 border-red-500/30',
  info:    'bg-slate-800 border-blue-500/30',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-xs pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl text-sm pointer-events-auto ${STYLES[t.type] ?? STYLES.info}`}
            style={{ animation: 'fadeInUp 0.25s ease-out' }}
          >
            {ICONS[t.type]}
            <span className="flex-1 text-white font-medium">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-slate-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
