import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  useAdminProgramme, useAdminProgrammeTasks, useCancelProgramme,
  useDeleteAdminProgramme, useRetryAdminProgramme,
} from 'src/hooks/useAdminProgrammes';
import { API_BASE_URL } from 'src/config/api';
import { getAccessToken } from 'src/api/authStore';
import { extractErrorMessage } from 'src/api/client';
import StatusBadge from 'src/components/ui/StatusBadge';
import ProgressBar from 'src/components/ui/ProgressBar';
import ConfirmModal from 'src/components/ui/ConfirmModal';
import { Card, CardHeader, CardBody } from 'src/components/ui/Card';
import { useToast } from 'src/components/ui/Toast';
import {
  ChevronLeft, TerminalSquare, ListChecks, BarChart2, CheckCircle2,
  XCircle, Loader, RefreshCw, StopCircle, Copy, FileCode,
  Clock, Activity, AlertTriangle, Server, Network,
  Download, Trash2, Play,
} from 'lucide-react';

const TERMINAL_STATUSES = new Set(['termine', 'echec', 'annule']);
const ACTIVE_STATUSES = new Set(['soumis', 'en_decomposition', 'en_cours']);

// ─── Shared with ProgrammeDetailPage ────────────────────────────────────────
function colorizeLog(line) {
  if (!line) return { color: 'text-slate-600', prefix: null };
  if (/ERROR|ERREUR|FAILED|ÉCHEC/i.test(line))  return { color: 'text-red-400',    prefix: '✗' };
  if (/WARNING|WARN|AVERTISSEMENT/i.test(line))  return { color: 'text-amber-400',  prefix: '⚠' };
  if (/SUCCESS|DONE|TERMINÉ|OK/i.test(line))     return { color: 'text-emerald-400',prefix: '✓' };
  if (/INFO/i.test(line))                        return { color: 'text-blue-400',   prefix: '›' };
  if (/\[PARALLAX\]/i.test(line))                return { color: 'text-violet-400', prefix: '⬡' };
  return { color: 'text-slate-300', prefix: null };
}

function TaskDistributionBar({ tasks }) {
  if (!tasks.length) return null;
  const counts = tasks.reduce((acc, t) => { acc[t.status] = (acc[t.status] ?? 0) + 1; return acc; }, {});
  const total = tasks.length;
  const segments = [
    { key: 'terminee',   color: 'bg-emerald-500', label: 'Terminées' },
    { key: 'en_cours',   color: 'bg-orange-500',  label: 'En cours' },
    { key: 'assignee',   color: 'bg-blue-500',    label: 'Assignées' },
    { key: 'en_attente', color: 'bg-slate-300',   label: 'En attente' },
    { key: 'echouee',    color: 'bg-red-500',     label: 'Échouées' },
    { key: 'migree',     color: 'bg-violet-500',  label: 'Migrées' },
  ].filter((s) => counts[s.key]);

  return (
    <div>
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        {segments.map((s) => (
          <div key={s.key} title={`${s.label}: ${counts[s.key]}`} className={`${s.color} transition-all`} style={{ width: `${((counts[s.key] / total) * 100).toFixed(1)}%` }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-1.5">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-sm ${s.color}`} />
            <span className="text-xs text-slate-500">{s.label}: <strong className="text-slate-700">{counts[s.key]}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────
function OverviewTab({ programme: p, tasks }) {
  const done    = tasks.filter((t) => t.status === 'terminee').length;
  const failed  = tasks.filter((t) => t.status === 'echouee').length;
  const running = tasks.filter((t) => ['en_cours', 'assignee'].includes(t.status)).length;
  const total   = tasks.length;

  const duration = p.completed_at && p.started_at
    ? Math.round((new Date(p.completed_at) - new Date(p.started_at)) / 1000) : null;
  const fmt = (s) => s == null ? '—' : s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}min ${s % 60}s` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}min`;

  return (
    <div className="p-5 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: total, color: 'bg-slate-100 text-slate-600', icon: <ListChecks size={15} /> },
          { label: 'Terminées', value: done, color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={15} /> },
          { label: 'En cours', value: running, color: 'bg-orange-100 text-orange-700', icon: <Activity size={15} /> },
          { label: 'Échouées', value: failed, color: 'bg-red-100 text-red-700', icon: <XCircle size={15} /> },
        ].map((s) => (
          <div key={s.label} className={`flex items-center gap-3 p-3 rounded-xl ${s.color.split(' ')[0]}`}>
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
            { label: 'Importé',  time: p.uploaded_at,  done: true },
            { label: 'Soumis',   time: p.submitted_at, done: !!p.submitted_at },
            { label: 'Démarré',  time: p.started_at,   done: !!p.started_at },
            { label: 'Terminé',  time: p.completed_at, done: !!p.completed_at },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 text-xs ${step.done ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-300'}`}>
                {i + 1}
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className={`text-sm font-medium ${step.done ? 'text-slate-700' : 'text-slate-400'}`}>{step.label}</span>
                <span className="text-xs text-slate-400">
                  {step.time ? new Date(step.time).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
        <div><p className="text-xs text-slate-400 mb-0.5">Propriétaire</p><p className="text-sm font-mono font-semibold text-slate-700">{p.owner_id ?? '—'}</p></div>
        <div><p className="text-xs text-slate-400 mb-0.5">Durée totale</p><p className="text-sm font-semibold text-slate-700">{fmt(duration)}</p></div>
        <div><p className="text-xs text-slate-400 mb-0.5">Fichier</p><p className="text-sm font-mono text-slate-600 truncate">{p.original_filename ?? '—'}</p></div>
        <div><p className="text-xs text-slate-400 mb-0.5">Taille résultats</p><p className="text-sm text-slate-700">{p.result_size_bytes ? `${(p.result_size_bytes / 1024).toFixed(1)} Ko` : '—'}</p></div>
        {p.description && <div className="col-span-2"><p className="text-xs text-slate-400 mb-0.5">Description</p><p className="text-sm text-slate-600">{p.description}</p></div>}
        {p.error_message && (
          <div className="col-span-2">
            <p className="text-xs text-red-400 mb-1 flex items-center gap-1"><AlertTriangle size={10} />Message d'erreur</p>
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 font-mono break-all">{p.error_message}</p>
          </div>
        )}
        {(p.worker_nodes ?? []).length > 0 && (
          <div className="col-span-2">
            <p className="text-xs text-slate-400 mb-2 flex items-center gap-1"><Network size={10} />Nœuds workers impliqués</p>
            <div className="flex flex-wrap gap-2">
              {p.worker_nodes.map((uuid) => (
                <Link key={uuid} to={`/cluster/nodes/${uuid}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-blue-100 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-mono text-slate-700 hover:text-blue-700 transition-colors">
                  <Server size={10} />{uuid.slice(0, 12)}…
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TasksTab({ programmeId }) {
  const { data, isLoading, isError, refetch } = useAdminProgrammeTasks(programmeId);
  const tasks = Array.isArray(data) ? data : [];
  const [filter, setFilter] = useState('');
  const filtered = filter ? tasks.filter((t) => t.status === filter) : tasks;

  if (isLoading) return <div className="space-y-3 p-5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 rounded skeleton" />)}</div>;
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
      <p className="text-slate-400 text-sm">Aucune sous-tâche générée</p>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100">
        <TaskDistributionBar tasks={tasks} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="ml-auto shrink-0 text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none">
          <option value="">Toutes ({tasks.length})</option>
          {['en_attente', 'assignee', 'en_cours', 'terminee', 'echouee', 'migree'].map((s) => {
            const cnt = tasks.filter((t) => t.status === s).length;
            return cnt > 0 ? <option key={s} value={s}>{s} ({cnt})</option> : null;
          })}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fonction</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nœud</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tentatives</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Durée</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => {
              const dur = t.duration_ms ?? (t.completed_at && t.started_at ? new Date(t.completed_at) - new Date(t.started_at) : null);
              const isRunning = ['en_cours', 'assignee'].includes(t.status);
              return (
                <tr key={t.id ?? i} className={`border-b border-slate-100 last:border-0 ${isRunning ? 'bg-orange-50/30' : t.status === 'echouee' ? 'bg-red-50/30' : t.status === 'terminee' ? 'bg-emerald-50/20' : ''}`}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {isRunning && <Loader size={11} className="text-orange-500 animate-spin shrink-0" />}
                      {t.status === 'terminee' && <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />}
                      {t.status === 'echouee' && <XCircle size={11} className="text-red-500 shrink-0" />}
                      <div>
                        <p className="font-mono text-xs font-semibold text-slate-700">{t.function_name ?? '(anonyme)'}</p>
                        {t.annotation_id && <p className="text-[10px] text-slate-400 font-mono">{t.annotation_id}</p>}
                        {t.error_message && <p className="text-[10px] text-red-500 mt-0.5 max-w-xs truncate">{t.error_message}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><StatusBadge status={t.status} type="task" /></td>
                  <td className="px-3 py-2.5">
                    {t.worker_node_uuid
                      ? <Link to={`/cluster/nodes/${t.worker_node_uuid}`} className="text-xs font-mono text-blue-600 hover:underline">{t.worker_node_uuid.slice(0, 12)}…</Link>
                      : <span className="text-slate-300 text-xs">—</span>
                    }
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-xs font-semibold ${(t.attempts ?? 0) >= (t.max_attempts ?? 3) ? 'text-red-500' : 'text-slate-600'}`}>
                      {t.attempts ?? 0}/{t.max_attempts ?? 3}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-xs font-mono text-slate-500">
                      {dur != null ? dur >= 1000 ? `${(dur / 1000).toFixed(2)}s` : `${dur}ms` : isRunning ? '⏱' : '—'}
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

function LogsTab({ logs }) {
  const lines = logs ? logs.split('\n') : [];
  const MAX_LINES = 500;
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef(null);
  const displayed = showAll ? lines : lines.slice(-MAX_LINES);

  useEffect(() => {
    if (autoScroll && bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs, autoScroll]);

  const handleCopy = () => {
    navigator.clipboard.writeText(logs).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-amber-500/70" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
        </div>
        <span className="text-slate-400 text-xs font-mono flex-1">
          journal d'exécution · {lines.length} ligne{lines.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
            <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
            Auto-scroll
          </label>
          <button onClick={handleCopy} disabled={!logs} className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-white border border-slate-700 rounded hover:border-slate-500">
            <Copy size={10} />{copied ? 'Copié !' : 'Copier'}
          </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-b-xl overflow-auto max-h-[480px] p-4 font-mono text-xs">
        {!logs && <div className="text-slate-600 py-8 text-center"><TerminalSquare size={24} className="mx-auto mb-2 opacity-40" /><p>Aucun log disponible.</p></div>}
        {lines.length > MAX_LINES && !showAll && (
          <div className="text-center py-2 mb-2">
            <button onClick={() => setShowAll(true)} className="text-xs text-slate-500 hover:text-white border border-slate-700 px-3 py-1 rounded hover:border-slate-500">
              ↑ Afficher les {lines.length - MAX_LINES} premières lignes ({lines.length} au total)
            </button>
          </div>
        )}
        {displayed.map((line, i) => {
          const style = colorizeLog(line);
          const lineNum = showAll ? i + 1 : lines.length - MAX_LINES + i + 1;
          return (
            <div key={i} className="flex items-start gap-2 hover:bg-slate-800/50 px-1 rounded py-0.5 group">
              <span className="text-slate-700 select-none w-8 text-right shrink-0 group-hover:text-slate-500">{lineNum}</span>
              {style.prefix && <span className={`shrink-0 ${style.color}`}>{style.prefix}</span>}
              <span className={`whitespace-pre-wrap break-all ${style.color}`}>{line || <span className="text-slate-700">·</span>}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: <BarChart2 size={14} /> },
  { id: 'tasks',    label: 'Sous-tâches',    icon: <ListChecks size={14} /> },
  { id: 'logs',     label: 'Journal',         icon: <TerminalSquare size={14} /> },
];

export default function AdminProgrammeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [tab, setTab] = useState('overview');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data: programme, isLoading, isError, refetch } = useAdminProgramme(id);
  const { data: tasksData } = useAdminProgrammeTasks(id);
  const cancelMutation = useCancelProgramme();
  const deleteMutation = useDeleteAdminProgramme();
  const retryMutation = useRetryAdminProgramme();

  const p = programme ?? {};
  const tasks = Array.isArray(tasksData) ? tasksData : [];
  const progress = p.progress ?? {};
  const pct = progress.percent ?? null;
  const done = progress.done ?? null;
  const total = progress.total ?? null;
  const canCancel = !TERMINAL_STATUSES.has(p.status);
  const isActive = ACTIVE_STATUSES.has(p.status);

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(id);
      addToast('Programme annulé.', 'success');
      setShowCancelModal(false);
    } catch (err) {
      addToast(extractErrorMessage(err), 'error');
      setShowCancelModal(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast('Programme supprimé.', 'success');
      setShowDeleteModal(false);
      navigate('/cluster/programmes');
    } catch (err) {
      addToast(extractErrorMessage(err), 'error');
      setShowDeleteModal(false);
    }
  };

  const handleRetry = async () => {
    try {
      await retryMutation.mutateAsync(id);
      addToast('Programme soumis à nouveau.', 'success');
    } catch (err) {
      addToast(extractErrorMessage(err), 'error');
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE_URL}/api/programmes/${id}/result`, {
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
        <svg className="animate-spin h-8 w-8 text-blue-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
        <p className="text-slate-400 text-sm">Chargement…</p>
      </div>
    </div>
  );

  if (isError) return (
    <div className="text-center py-16">
      <XCircle size={40} className="text-slate-300 mx-auto mb-4" />
      <p className="text-slate-500 mb-4">Impossible de charger ce programme</p>
      <button onClick={() => refetch()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Réessayer</button>
    </div>
  );

  return (
    <div className="max-w-5xl space-y-5">
      <button onClick={() => navigate('/cluster/programmes')} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm transition-colors">
        <ChevronLeft size={15} />Programmes
      </button>

      {/* Header */}
      <Card>
        <CardBody>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-orange-100' : p.status === 'termine' ? 'bg-emerald-100' : p.status === 'echec' ? 'bg-red-100' : 'bg-slate-100'}`}>
                {isActive
                  ? <Loader size={20} className="text-orange-600 animate-spin" />
                  : p.status === 'termine' ? <CheckCircle2 size={20} className="text-emerald-600" />
                  : p.status === 'echec' ? <XCircle size={20} className="text-red-500" />
                  : <FileCode size={20} className="text-slate-400" />
                }
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-slate-900 truncate">{p.name}</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Propriétaire : <span className="font-mono font-medium text-slate-600">{p.owner_id ?? '—'}</span>
                  {p.original_filename && <> · <span className="font-mono">{p.original_filename}</span></>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={p.status} type="programme" />
              <button onClick={() => refetch()} className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50">
                <RefreshCw size={13} />
              </button>
            </div>
          </div>

          {/* Progress */}
          {pct != null && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-600">Progression du calcul distribué</span>
                <span className="text-xs text-slate-500">
                  {done != null && total != null ? `${done} / ${total} tâches` : `${pct.toFixed(1)}%`}
                </span>
              </div>
              <ProgressBar percent={pct} failed={p.status === 'echec'} />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-slate-400">{pct.toFixed(1)}% complété</span>
                {isActive && <span className="text-xs text-orange-600 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />Calcul en cours</span>}
                {p.status === 'termine' && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 size={11} />Terminé</span>}
              </div>
            </div>
          )}

          {/* Task distribution */}
          {tasks.length > 0 && (
            <div className="mb-4">
              <TaskDistributionBar tasks={tasks} />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={cancelMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 border border-orange-200 text-orange-600 rounded-lg text-sm hover:bg-orange-50 transition-colors disabled:opacity-50"
              >
                <StopCircle size={14} />
                {cancelMutation.isPending ? 'Annulation…' : 'Annuler l\'exécution'}
              </button>
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
                onClick={handleRetry}
                disabled={retryMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:opacity-50"
              >
                <Play size={14} />
                {retryMutation.isPending ? 'Soumission…' : 'Réessayer'}
              </button>
            )}
            {TERMINAL_STATUSES.has(p.status) && (
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

      {/* Tabs */}
      <Card>
        <div className="flex border-b border-slate-100">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                tab === t.id ? 'border-blue-600 text-blue-700 bg-blue-50/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {t.icon}{t.label}
              {t.id === 'tasks' && tasks.length > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab === t.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{tasks.length}</span>
              )}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab programme={p} tasks={tasks} />}
        {tab === 'tasks'    && <TasksTab programmeId={id} />}
        {tab === 'logs'     && <LogsTab logs={p.execution_log ?? ''} />}
      </Card>

      <ConfirmModal
        isOpen={showCancelModal}
        title="Annuler le programme"
        message="L'exécution sera interrompue immédiatement. Les tâches en cours seront abandonnées. Cette action est irréversible."
        confirmLabel="Annuler le programme"
        variant="warning"
        isPending={cancelMutation.isPending}
        onConfirm={handleCancel}
        onCancel={() => setShowCancelModal(false)}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Supprimer le programme"
        message="Cette action est irréversible. Le programme et toutes ses données seront définitivement supprimés."
        confirmLabel="Supprimer"
        variant="danger"
        isPending={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
