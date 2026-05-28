import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useProgramme, useProgrammeTasks, useProgrammeLogs,
  useSubmitProgramme, useDeleteProgramme,
} from 'src/hooks/useTasks';
import { API_BASE_URL } from 'src/config/api';
import { getAccessToken } from 'src/api/authStore';
import StatusBadge from 'src/components/ui/StatusBadge';
import ProgressBar from 'src/components/ui/ProgressBar';
import ConfirmModal from 'src/components/ui/ConfirmModal';
import { Card, CardHeader, CardBody } from 'src/components/ui/Card';
import { useToast } from 'src/components/ui/Toast';
import {
  ChevronLeft, Play, Download, Trash2, RefreshCw,
  TerminalSquare, ListChecks, BarChart2, CheckCircle2,
  XCircle, Clock, Activity, Cpu, Copy, ChevronDown,
  AlertTriangle, FileCode, Loader, StopCircle,
} from 'lucide-react';

const ACTIVE_STATUSES = new Set(['soumis', 'en_decomposition', 'en_cours']);
const TERMINAL_STATUSES = new Set(['termine', 'echec', 'annule']);

// ─── Task status distribution bar ───────────────────────────────────────────
function TaskDistributionBar({ tasks }) {
  if (!tasks.length) return null;
  const counts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});
  const total = tasks.length;

  const segments = [
    { key: 'terminee',  color: 'bg-emerald-500', label: 'Terminées' },
    { key: 'en_cours',  color: 'bg-orange-500',  label: 'En cours' },
    { key: 'assignee',  color: 'bg-blue-500',     label: 'Assignées' },
    { key: 'en_attente',color: 'bg-slate-300',    label: 'En attente' },
    { key: 'echouee',   color: 'bg-red-500',      label: 'Échouées' },
    { key: 'migree',    color: 'bg-violet-500',   label: 'Migrées' },
  ].filter((s) => counts[s.key]);

  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {segments.map((s) => (
          <div
            key={s.key}
            title={`${s.label}: ${counts[s.key]}`}
            className={`${s.color} transition-all duration-700`}
            style={{ width: `${((counts[s.key] / total) * 100).toFixed(1)}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-2">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${s.color}`} />
            <span className="text-xs text-slate-500">
              {s.label}: <strong className="text-slate-700">{counts[s.key]}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tasks table ────────────────────────────────────────────────────────────
function TasksTab({ programmeId, isActive }) {
  const { data, isLoading, isError, refetch } = useProgrammeTasks(programmeId);
  const tasks = Array.isArray(data) ? data : [];
  const [filter, setFilter] = useState('');

  const filtered = filter ? tasks.filter((t) => t.status === filter) : tasks;

  if (isLoading) return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 rounded skeleton" />)}
    </div>
  );
  if (isError) return (
    <div className="text-center py-10">
      <XCircle size={28} className="text-slate-300 mx-auto mb-2" />
      <p className="text-slate-500 text-sm mb-3">Erreur de chargement</p>
      <button onClick={() => refetch()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Réessayer</button>
    </div>
  );
  if (!tasks.length) return (
    <div className="text-center py-12">
      <ListChecks size={32} className="text-slate-200 mx-auto mb-3" />
      <p className="text-slate-400 text-sm">Aucune sous-tâche générée pour le moment</p>
      <p className="text-slate-300 text-xs mt-1">Les tâches apparaîtront après la décomposition du programme</p>
    </div>
  );

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100">
        <TaskDistributionBar tasks={tasks} />
        <div className="ml-auto shrink-0">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Toutes ({tasks.length})</option>
            {['en_attente', 'assignee', 'en_cours', 'terminee', 'echouee', 'migree'].map((s) => {
              const cnt = tasks.filter((t) => t.status === s).length;
              return cnt > 0 ? <option key={s} value={s}>{s} ({cnt})</option> : null;
            })}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fonction</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nœud assigné</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tentatives</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Durée</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, idx) => {
              const durationMs = t.duration_ms ??
                (t.completed_at && t.started_at
                  ? new Date(t.completed_at) - new Date(t.started_at)
                  : null);
              const isRunning = t.status === 'en_cours' || t.status === 'assignee';
              const isFailed = t.status === 'echouee';
              const isDone = t.status === 'terminee';

              return (
                <tr
                  key={t.id ?? idx}
                  className={`border-b border-slate-100 last:border-0 transition-colors ${
                    isRunning ? 'bg-orange-50/30 hover:bg-orange-50/60' :
                    isFailed ? 'bg-red-50/30 hover:bg-red-50/60' :
                    isDone ? 'bg-emerald-50/20 hover:bg-emerald-50/40' :
                    'hover:bg-slate-50'
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {isRunning && <Loader size={12} className="text-orange-500 animate-spin shrink-0" />}
                      {isDone && <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />}
                      {isFailed && <XCircle size={12} className="text-red-500 shrink-0" />}
                      <div>
                        <p className="font-mono text-xs font-semibold text-slate-700">
                          {t.function_name ?? '(anonyme)'}
                        </p>
                        {t.annotation_id && (
                          <p className="text-[10px] text-slate-400 font-mono">{t.annotation_id}</p>
                        )}
                        {isFailed && t.error_message && (
                          <p className="text-[10px] text-red-500 mt-0.5 max-w-xs truncate">
                            {t.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={t.status} type="task" />
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs font-mono text-slate-500">
                      {t.worker_node_uuid
                        ? t.worker_node_uuid.slice(0, 12) + '…'
                        : <span className="text-slate-300">—</span>
                      }
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-xs font-semibold ${
                      (t.attempts ?? 0) >= (t.max_attempts ?? 3)
                        ? 'text-red-500'
                        : 'text-slate-600'
                    }`}>
                      {t.attempts ?? 0}/{t.max_attempts ?? 3}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-xs font-mono text-slate-500">
                      {durationMs != null
                        ? durationMs >= 1000
                          ? `${(durationMs / 1000).toFixed(2)}s`
                          : `${durationMs}ms`
                        : isRunning ? <span className="text-orange-500 animate-pulse">⏱</span> : '—'
                      }
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Logs terminal ───────────────────────────────────────────────────────────
function colorizeLog(line) {
  if (!line) return null;
  if (/ERROR|ERREUR|FAILED|ÉCHEC/i.test(line))
    return { color: 'text-red-400', prefix: '✗' };
  if (/WARNING|WARN|AVERTISSEMENT/i.test(line))
    return { color: 'text-amber-400', prefix: '⚠' };
  if (/SUCCESS|DONE|TERMINÉ|OK|COMPLETE/i.test(line))
    return { color: 'text-emerald-400', prefix: '✓' };
  if (/INFO|DEBUG/i.test(line))
    return { color: 'text-blue-400', prefix: '›' };
  if (/\[PARALLAX\]|PARALLAX:/i.test(line))
    return { color: 'text-violet-400', prefix: '⬡' };
  return { color: 'text-slate-300', prefix: null };
}

function LogsTab({ programmeId, isActive }) {
  const { data, isLoading, isError, refetch } = useProgrammeLogs(programmeId);
  const logs = typeof data === 'string' ? data : data?.logs ?? '';
  const lines = logs ? logs.split('\n') : [];
  const bottomRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleCopy = () => {
    navigator.clipboard.writeText(logs).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-800 border-b border-slate-700 rounded-t-none">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-amber-500/70" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
        </div>
        <span className="text-slate-400 text-xs font-mono flex-1">
          PARALLAX · journal d'exécution
          {lines.length > 0 && <span className="ml-2 text-slate-500">({lines.length} lignes)</span>}
        </span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            Défilement auto
          </label>
          <button
            onClick={() => refetch()}
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
            title="Rafraîchir les logs"
          >
            <RefreshCw size={12} />
          </button>
          <button
            onClick={handleCopy}
            disabled={!logs}
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-white border border-slate-700 rounded hover:border-slate-500 transition-colors"
          >
            <Copy size={11} />
            {copied ? 'Copié !' : 'Copier'}
          </button>
        </div>
      </div>

      {/* Log content */}
      <div className="bg-slate-900 rounded-b-xl overflow-auto max-h-[480px] p-4 font-mono text-xs">
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 py-4">
            <Loader size={14} className="animate-spin" />
            Chargement des logs…
          </div>
        )}
        {isError && (
          <div className="text-red-400 py-4">Erreur de chargement des logs.</div>
        )}
        {!isLoading && !isError && !logs && (
          <div className="text-slate-600 py-8 text-center">
            <TerminalSquare size={24} className="mx-auto mb-2 opacity-40" />
            <p>Aucun log disponible.</p>
            <p className="text-xs mt-1">Les logs apparaîtront dès le début de l'exécution.</p>
          </div>
        )}
        {!isLoading && lines.map((line, i) => {
          const style = colorizeLog(line);
          return (
            <div key={i} className="flex items-start gap-2 hover:bg-slate-800/50 px-1 rounded py-0.5 group">
              <span className="text-slate-700 select-none w-8 text-right shrink-0 group-hover:text-slate-500">
                {i + 1}
              </span>
              {style?.prefix && (
                <span className={`shrink-0 ${style.color}`}>{style.prefix}</span>
              )}
              <span className={`whitespace-pre-wrap break-all ${style?.color ?? 'text-slate-300'}`}>
                {line || <span className="text-slate-700">·</span>}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────
function OverviewTab({ programme, tasks }) {
  const p = programme;
  const done = tasks.filter((t) => t.status === 'terminee').length;
  const failed = tasks.filter((t) => t.status === 'echouee').length;
  const running = tasks.filter((t) => t.status === 'en_cours' || t.status === 'assignee').length;
  const waiting = tasks.filter((t) => t.status === 'en_attente').length;
  const total = tasks.length;

  const duration = p.completed_at && p.started_at
    ? Math.round((new Date(p.completed_at) - new Date(p.started_at)) / 1000)
    : null;

  function fmtDuration(s) {
    if (s == null) return '—';
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}min ${s % 60}s`;
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}min`;
  }

  return (
    <div className="p-5 space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total tâches', value: total, icon: <ListChecks size={16} />, color: 'bg-slate-100 text-slate-600' },
          { label: 'Terminées', value: done, icon: <CheckCircle2 size={16} />, color: 'bg-emerald-100 text-emerald-700' },
          { label: 'En cours', value: running, icon: <Activity size={16} />, color: 'bg-orange-100 text-orange-700' },
          { label: 'Échouées', value: failed, icon: <XCircle size={16} />, color: 'bg-red-100 text-red-700' },
        ].map((s) => (
          <div key={s.label} className={`flex items-center gap-3 p-3 rounded-xl ${s.color.split(' ')[0]} border border-opacity-40`}>
            <div className={`p-2 rounded-lg ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-2xl font-black text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Chronologie</h4>
        <div className="space-y-3">
          {[
            { label: 'Importé', time: p.uploaded_at, icon: <FileCode size={13} />, done: true },
            { label: 'Soumis', time: p.submitted_at, icon: <Play size={13} />, done: !!p.submitted_at },
            { label: 'Démarré', time: p.started_at, icon: <Cpu size={13} />, done: !!p.started_at },
            { label: 'Terminé', time: p.completed_at, icon: <CheckCircle2 size={13} />, done: !!p.completed_at },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 ${
                step.done
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-slate-300 text-slate-300'
              }`}>
                {step.icon}
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className={`text-sm font-medium ${step.done ? 'text-slate-700' : 'text-slate-400'}`}>
                  {step.label}
                </span>
                <span className="text-xs text-slate-400">
                  {step.time
                    ? new Date(step.time).toLocaleString('fr-FR', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })
                    : '—'
                  }
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Fichier source</p>
          <p className="text-sm font-mono font-medium text-slate-700 truncate">
            {p.original_filename ?? '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Durée d'exécution</p>
          <p className="text-sm font-semibold text-slate-700">{fmtDuration(duration)}</p>
        </div>
        {p.description && (
          <div className="col-span-2">
            <p className="text-xs text-slate-400 mb-0.5">Description</p>
            <p className="text-sm text-slate-600">{p.description}</p>
          </div>
        )}
        {p.error_message && (
          <div className="col-span-2">
            <p className="text-xs text-red-400 mb-1 flex items-center gap-1">
              <AlertTriangle size={11} /> Message d'erreur
            </p>
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 font-mono">
              {p.error_message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: <BarChart2 size={14} /> },
  { id: 'tasks',    label: 'Sous-tâches',     icon: <ListChecks size={14} /> },
  { id: 'logs',     label: 'Journal',          icon: <TerminalSquare size={14} /> },
];

export default function ProgrammeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [tab, setTab] = useState('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data: programme, isLoading, isError, refetch } = useProgramme(id);
  const { data: tasksData } = useProgrammeTasks(id);
  const submitMutation = useSubmitProgramme();
  const deleteMutation = useDeleteProgramme();

  const p = programme ?? {};
  const tasks = Array.isArray(tasksData) ? tasksData : [];
  const progress = p.progress ?? {};
  const pct = progress.percent ?? p.progress_percent ?? null;
  const done = progress.done ?? null;
  const total = progress.total ?? null;
  const isActive = ACTIVE_STATUSES.has(p.status);
  const isTerminal = TERMINAL_STATUSES.has(p.status);

  const handleSubmit = async () => {
    try {
      await submitMutation.mutateAsync(id);
      addToast('Programme soumis au cluster.', 'success');
    } catch {
      addToast('Erreur lors de la soumission.', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast('Programme supprimé.', 'success');
      navigate('/dashboard');
    } catch {
      addToast('Erreur lors de la suppression.', 'error');
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE_URL}/api/tasks/${id}/result`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resultats_${p.name ?? id}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      addToast('Erreur lors du téléchargement.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-8 w-8 text-blue-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-slate-400 text-sm">Chargement du programme…</p>
      </div>
    </div>
  );

  if (isError) return (
    <div className="text-center py-16">
      <XCircle size={40} className="text-slate-300 mx-auto mb-4" />
      <p className="text-slate-500 mb-4">Impossible de charger ce programme</p>
      <button onClick={() => refetch()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
        Réessayer
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl space-y-5">
      {/* Back link */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm transition-colors"
      >
        <ChevronLeft size={15} />
        Mes projets
      </button>

      {/* Header card */}
      <Card>
        <CardBody>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                p.status === 'en_cours' ? 'bg-orange-100' :
                p.status === 'termine' ? 'bg-emerald-100' :
                p.status === 'echec' ? 'bg-red-100' :
                p.status === 'en_decomposition' ? 'bg-blue-100' :
                'bg-slate-100'
              }`}>
                {p.status === 'en_cours' || p.status === 'en_decomposition'
                  ? <Loader size={22} className={`${p.status === 'en_cours' ? 'text-orange-600' : 'text-blue-600'} animate-spin`} />
                  : p.status === 'termine'
                  ? <CheckCircle2 size={22} className="text-emerald-600" />
                  : p.status === 'echec'
                  ? <XCircle size={22} className="text-red-500" />
                  : <FileCode size={22} className="text-slate-400" />
                }
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-slate-900 truncate">{p.name}</h1>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{p.original_filename ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={p.status} type="programme" />
              <button
                onClick={() => refetch()}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {pct != null && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-600">Progression du calcul distribué</span>
                <span className="text-xs text-slate-500">
                  {done != null && total != null
                    ? `${done} / ${total} tâches`
                    : `${pct.toFixed(1)}%`
                  }
                </span>
              </div>
              <ProgressBar percent={pct} failed={p.status === 'echec'} />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-slate-400">{pct.toFixed(1)}% complété</span>
                {isActive && (
                  <span className="text-xs text-orange-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    Exécution en cours
                  </span>
                )}
                {p.status === 'termine' && (
                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    Calcul terminé
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {p.status === 'soumis' && (
              <button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-600/20"
              >
                <Play size={14} />
                {submitMutation.isPending ? 'Lancement…' : 'Lancer l\'exécution'}
              </button>
            )}
            {p.status === 'en_decomposition' && (
              <div className="flex items-center gap-2 text-blue-600 text-sm font-medium px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <Loader size={14} className="animate-spin" />
                Analyse en cours…
              </div>
            )}
            {p.status === 'en_cours' && (
              <div className="flex items-center gap-2 text-orange-600 text-sm font-medium px-3 py-2 bg-orange-50 rounded-lg border border-orange-200">
                <Activity size={14} className="animate-pulse" />
                Exécution distribuée en cours
              </div>
            )}
            {p.status === 'termine' && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 shadow-lg shadow-emerald-600/20"
              >
                <Download size={14} />
                {downloading ? 'Téléchargement…' : 'Télécharger les résultats'}
              </button>
            )}
            {p.status === 'echec' && (
              <button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:opacity-50"
              >
                <RefreshCw size={14} />
                Réessayer
              </button>
            )}
            {(p.status === 'soumis' || p.status === 'echec' || p.status === 'annule') && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
                Supprimer
              </button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Tabs card */}
      <Card>
        {/* Tab headers */}
        <div className="flex border-b border-slate-100">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-blue-600 text-blue-700 bg-blue-50/30'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {t.icon}
              {t.label}
              {t.id === 'tasks' && tasks.length > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  tab === t.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {tasks.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'overview' && <OverviewTab programme={p} tasks={tasks} />}
        {tab === 'tasks' && <TasksTab programmeId={id} isActive={isActive} />}
        {tab === 'logs' && <LogsTab programmeId={id} isActive={isActive} />}
      </Card>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Supprimer le programme"
        message="Cette action est irréversible. Le programme et toutes ses données seront définitivement supprimés."
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
