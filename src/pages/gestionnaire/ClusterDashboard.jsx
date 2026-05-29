import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClusterStats, useNodes } from 'src/hooks/useNodes';
import { useNetworkStatus } from 'src/hooks/useNetworkStatus';
import StatusBadge from 'src/components/ui/StatusBadge';
import MetricBar from 'src/components/ui/MetricBar';
import StatCard from 'src/components/ui/StatCard';
import { Card, CardHeader, CardBody } from 'src/components/ui/Card';
import {
  Server, Activity, CheckCircle2, XCircle, Wrench, RefreshCw,
  ChevronRight, Zap, Clock, AlertTriangle, ChevronUp, ChevronDown,
  WifiOff,
} from 'lucide-react';

const REFRESH_INTERVAL = 5000;

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 2) return 'maintenant';
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}min`;
}

function SortIcon({ field, sortState }) {
  if (sortState.field !== field) return <ChevronUp size={11} className="text-slate-300" />;
  return sortState.dir === 'asc'
    ? <ChevronUp size={11} className="text-blue-500" />
    : <ChevronDown size={11} className="text-blue-500" />;
}

function NodeRow({ node, onClick }) {
  const hb = node.last_heartbeat_at;
  const hbAge = hb ? Math.floor((Date.now() - new Date(hb)) / 1000) : null;
  const stale = hbAge != null && hbAge > 6;
  const cpu = node.current_cpu_usage ?? 0;
  const ram = node.current_ram_usage ?? 0;

  return (
    <tr
      className="group hover:bg-blue-50/50 cursor-pointer transition-colors border-b border-slate-100 last:border-0"
      onClick={onClick}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full shrink-0 ${
            node.status === 'actif' ? 'bg-emerald-500 animate-pulse' :
            node.status === 'surcharge' ? 'bg-amber-500 animate-pulse' :
            node.status === 'en_panne' ? 'bg-red-500' : 'bg-slate-400'
          }`} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {node.hostname ?? '—'}
            </p>
            <p className="text-xs text-slate-400 font-mono">{node.ip ?? '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
          node.role === 'master'
            ? 'bg-violet-100 text-violet-700 border border-violet-200'
            : 'bg-slate-100 text-slate-600 border border-slate-200'
        }`}>
          {node.role === 'master' ? '★ Master' : 'Worker'}
        </span>
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={node.status} type="node" />
      </td>
      <td className="px-3 py-3 w-36">
        <MetricBar value={cpu} height="h-1.5" />
      </td>
      <td className="px-3 py-3 w-36">
        <MetricBar value={ram} height="h-1.5" />
      </td>
      <td className="px-3 py-3 text-center">
        <span className={`font-bold text-sm ${(node.current_tasks_count ?? 0) > 0 ? 'text-orange-600' : 'text-slate-300'}`}>
          {node.current_tasks_count ?? 0}
        </span>
      </td>
      <td className="px-3 py-3 text-center">
        <span className="text-sm font-mono text-slate-600">
          {node.current_score != null ? node.current_score.toFixed(2) : '—'}
        </span>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5 text-xs">
          {stale && <AlertTriangle size={11} className="text-amber-500 shrink-0" title="Heartbeat en retard" />}
          <span className={stale ? 'text-amber-600 font-medium' : 'text-slate-400'}>{timeAgo(hb)}</span>
        </div>
      </td>
      <td className="px-3 py-3 text-right">
        <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors ml-auto" />
      </td>
    </tr>
  );
}

export default function ClusterDashboard() {
  const navigate = useNavigate();
  const { isOnline } = useNetworkStatus();
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState({ field: 'status', dir: 'asc' });
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);

  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useClusterStats();
  const { data: nodesData, isLoading: nodesLoading, isError: nodesError, refetch: refetchNodes } = useNodes(filters);

  const rawNodes = nodesData?.items ?? [];

  const nodes = [...rawNodes].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    if (sort.field === 'hostname') return dir * (a.hostname ?? '').localeCompare(b.hostname ?? '');
    if (sort.field === 'cpu') return dir * ((a.current_cpu_usage ?? 0) - (b.current_cpu_usage ?? 0));
    if (sort.field === 'ram') return dir * ((a.current_ram_usage ?? 0) - (b.current_ram_usage ?? 0));
    if (sort.field === 'tasks') return dir * ((a.current_tasks_count ?? 0) - (b.current_tasks_count ?? 0));
    if (sort.field === 'score') return dir * ((a.current_score ?? 0) - (b.current_score ?? 0));
    // Default: status order
    const order = { actif: 0, surcharge: 1, en_maintenance: 2, eteint: 3, en_panne: 4 };
    return dir * ((order[a.status] ?? 9) - (order[b.status] ?? 9));
  });

  const handleSort = (field) => {
    setSort((s) => s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' });
  };

  const doRefresh = useCallback(() => {
    refetchStats();
    refetchNodes();
    setCountdown(REFRESH_INTERVAL / 1000);
  }, [refetchStats, refetchNodes]);

  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(doRefresh, REFRESH_INTERVAL);
    const tick = setInterval(() => setCountdown((c) => (c > 1 ? c - 1 : REFRESH_INTERVAL / 1000)), 1000);
    return () => { clearInterval(interval); clearInterval(tick); };
  }, [doRefresh, isOnline]);

  const ns = stats?.nodes ?? {};
  const ts = stats?.tasks ?? {};

  const ThCell = ({ field, children, className = '' }) => (
    <th
      onClick={() => handleSort(field)}
      className={`text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none ${className}`}
    >
      <span className="flex items-center gap-1">
        {children}
        <SortIcon field={field} sortState={sort} />
      </span>
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Vue d'ensemble du Cluster</h1>
          <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-2">
            Surveillance en temps réel
            {isOnline
              ? <span className="text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Rafraîchissement dans {countdown}s</span>
              : <span className="text-red-500 flex items-center gap-1"><WifiOff size={11} />Hors ligne — données figées</span>
            }
          </p>
        </div>
        <button
          onClick={doRefresh}
          disabled={!isOnline}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={13} />
          Rafraîchir
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {statsLoading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 rounded-xl skeleton" />)
          : statsError
          ? <div className="col-span-6 text-center py-4 text-slate-400 text-sm flex items-center justify-center gap-2"><XCircle size={16} />Impossible de charger les statistiques</div>
          : <>
              <StatCard label="Nœuds actifs"    value={ns.actifs ?? 0}        icon={<CheckCircle2 size={16} />} color="green"  sub={`sur ${ns.total ?? 0} total`} />
              <StatCard label="Surchargés"       value={ns.surcharges ?? 0}    icon={<Zap size={16} />}          color="orange" sub="charge élevée" />
              <StatCard label="En panne"         value={ns.en_panne ?? 0}      icon={<XCircle size={16} />}      color="red"    sub="hors ligne" />
              <StatCard label="Maintenance"      value={ns.en_maintenance ?? 0}icon={<Wrench size={16} />}       color="slate"  sub="suspendus" />
              <StatCard label="Tâches en cours"  value={ts.en_cours ?? 0}      icon={<Activity size={16} />}     color="blue"   sub="exécution active" />
              <StatCard label="En file d'attente"value={ts.en_attente ?? 0}    icon={<Clock size={16} />}        color="violet" sub="en attente" />
            </>
        }
      </div>

      {/* Node table */}
      <Card>
        <CardHeader
          title="Nœuds du Cluster"
          subtitle={rawNodes.length > 0 ? `${rawNodes.length} nœud${rawNodes.length > 1 ? 's' : ''} · cliquez sur une ligne pour le détail` : undefined}
          action={
            <div className="flex items-center gap-2">
              <select
                value={filters.role ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value || undefined }))}
                className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Tous rôles</option>
                <option value="worker">Worker</option>
                <option value="master">Master</option>
              </select>
              <select
                value={filters.status ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
                className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Tous statuts</option>
                <option value="actif">Actif</option>
                <option value="surcharge">Surchargé</option>
                <option value="en_panne">En panne</option>
                <option value="en_maintenance">Maintenance</option>
                <option value="eteint">Éteint</option>
              </select>
            </div>
          }
        />

        {nodesLoading && (
          <CardBody>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 rounded-lg skeleton" />)}
            </div>
          </CardBody>
        )}

        {nodesError && !nodesLoading && (
          <CardBody>
            <div className="text-center py-8">
              <XCircle size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm mb-3">Impossible de charger les nœuds</p>
              <button onClick={() => refetchNodes()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Réessayer</button>
            </div>
          </CardBody>
        )}

        {!nodesLoading && !nodesError && nodes.length === 0 && (
          <CardBody>
            <div className="text-center py-12">
              <Server size={40} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Aucun nœud enregistré dans le cluster</p>
              <p className="text-slate-300 text-xs mt-1">Les nœuds rejoignent automatiquement via l'agent C au démarrage</p>
            </div>
          </CardBody>
        )}

        {!nodesLoading && !nodesError && nodes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <ThCell field="hostname" className="px-4">Nœud</ThCell>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rôle</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                  <ThCell field="cpu" className="w-36">CPU</ThCell>
                  <ThCell field="ram" className="w-36">RAM</ThCell>
                  <ThCell field="tasks" className="text-center">Tâches</ThCell>
                  <ThCell field="score" className="text-center">Score</ThCell>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Heartbeat</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {nodes.map((node) => (
                  <NodeRow key={node.uuid} node={node} onClick={() => navigate(`/cluster/nodes/${node.uuid}`)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Topology map */}
      {!nodesLoading && nodes.length > 0 && (
        <Card>
          <CardHeader title="Topologie" subtitle="Vue schématique — cliquez pour accéder au détail d'un nœud" />
          <CardBody>
            <div className="flex flex-wrap gap-3">
              {nodes.map((node) => {
                const cpu = node.current_cpu_usage ?? 0;
                const ram = node.current_ram_usage ?? 0;
                const borderColor =
                  node.status === 'actif' ? 'border-emerald-400 bg-emerald-50' :
                  node.status === 'surcharge' ? 'border-amber-400 bg-amber-50' :
                  node.status === 'en_panne' ? 'border-red-400 bg-red-50' :
                  'border-slate-300 bg-slate-50';

                return (
                  <div
                    key={node.uuid}
                    onClick={() => navigate(`/cluster/nodes/${node.uuid}`)}
                    className={`card-hover cursor-pointer border-2 rounded-xl p-3 min-w-[150px] ${borderColor} ${node.role === 'master' ? 'ring-2 ring-violet-400/50' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Server size={12} className={node.role === 'master' ? 'text-violet-600' : 'text-slate-400'} />
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[80px]">
                          {node.hostname ?? node.uuid?.slice(0, 8)}
                        </span>
                      </div>
                      {node.role === 'master' && <span className="text-[9px] bg-violet-100 text-violet-700 px-1 rounded font-bold">M</span>}
                    </div>
                    <div className="space-y-1">
                      {[{ label: 'CPU', val: cpu }, { label: 'RAM', val: ram }].map((m) => (
                        <div key={m.label} className="flex items-center gap-1">
                          <span className="text-[9px] text-slate-400 w-5">{m.label}</span>
                          <div className="flex-1 bg-slate-200 rounded-full h-1">
                            <div className={`h-1 rounded-full ${m.val > 0.85 ? 'bg-red-500' : m.val > 0.65 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${(m.val * 100).toFixed(0)}%` }} />
                          </div>
                          <span className="text-[9px] font-mono text-slate-400 w-7 text-right">{(m.val * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <StatusBadge status={node.status} type="node" />
                      {(node.current_tasks_count ?? 0) > 0 && (
                        <span className="text-[10px] font-bold text-orange-600">{node.current_tasks_count}t</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
