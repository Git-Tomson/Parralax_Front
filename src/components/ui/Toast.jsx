import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X, WifiOff } from 'lucide-react';

const ToastContext = createContext(null);

let idCounter = 0;
const MAX_TOASTS = 4;
const DEDUP_MS = 600;

const CONFIG = {
  success: { icon: <CheckCircle2 size={15} />, bar: 'bg-emerald-500', text: 'text-emerald-400' },
  error:   { icon: <XCircle size={15} />,      bar: 'bg-red-500',     text: 'text-red-400'     },
  warning: { icon: <AlertTriangle size={15} />, bar: 'bg-amber-500',  text: 'text-amber-400'   },
  info:    { icon: <Info size={15} />,          bar: 'bg-blue-500',   text: 'text-blue-400'    },
  offline: { icon: <WifiOff size={15} />,       bar: 'bg-slate-500',  text: 'text-slate-400'   },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const recentMessages = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4500) => {
    // Déduplication : ignore si même message dans les DEDUP_MS dernières ms
    const key = `${type}:${message}`;
    if (recentMessages.current.has(key)) return;
    recentMessages.current.set(key, true);
    setTimeout(() => recentMessages.current.delete(key), DEDUP_MS);

    const id = ++idCounter;
    setToasts((prev) => {
      // Limite à MAX_TOASTS : retire le plus vieux si dépassé
      const next = [...prev, { id, message, type }];
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
    });
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col-reverse gap-2 max-w-sm pointer-events-none"
      >
        {toasts.map((t) => {
          const cfg = CONFIG[t.type] ?? CONFIG.info;
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-3 bg-slate-800 border border-slate-700/80 rounded-xl px-4 py-3 shadow-2xl"
              style={{ animation: 'fadeInUp 0.22s ease-out' }}
            >
              {/* Colored accent bar */}
              <div className={`w-0.5 self-stretch rounded-full ${cfg.bar} shrink-0`} />
              <span className={`shrink-0 mt-0.5 ${cfg.text}`}>{cfg.icon}</span>
              <p className="flex-1 text-sm text-white leading-snug">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-slate-500 hover:text-slate-200 transition-colors mt-0.5"
                aria-label="Fermer"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
