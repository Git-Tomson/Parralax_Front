import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClusterStats, useNodes } from 'src/hooks/useNodes';
import StatusBadge from 'src/components/ui/StatusBadge';
import MetricBar from 'src/components/ui/MetricBar';
import StatCard from 'src/components/ui/StatCard';
import { Card, CardHeader, CardBody } from 'src/components/ui/Card';
import {
  Server, Cpu, MemoryStick, Activity, AlertTriangle,
  CheckCircle2, XCircle, Wrench, PowerOff, RefreshCw,
  ChevronRight, Zap, Clock,
} from 'lucide-react';

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 5) return 'maintenant';
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  return `${Math.floor(diff / 3600)}h`;
}

function NodeRow({ node, onClick }) {
  const hb = node.last_heartbeat_at;
  const hbAge = hb ? Math.floor((Date.now() - new Date(hb)) / 1000) : null;
  const stale = hbAge != null && hbAge > 5;
  const cpu = node.current_cpu_usage ?? 0;
  const ram = node.current_ram_usage ?? 0;

  return (
    <tr
      className="group hover:bg-blue-50/50 cursor-pointer transition-colors border-b border-slate-100 last:border-0"
      onClick={onClick}
    >
      {/* Status dot + hostname */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              node.status === 'actif' ? 'bg-emerald-500 animate-pulse' :
              node.status === 'surcharge' ? 'bg-amber-500 animate-pulse' :
              node.status === 'en_panne' ? 'bg-red-500' :
              'bg-slate-400'
            }`}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {node.hostname ?? node.uuid?.slice(0, 12) ?? '—'}
            </p>
            <p className="text-xs text-slate-400 font-mono truncate">{node.ip ?? '—'}</p>
          </div>
        </div>
      </td>

      {/* Role badge */}
      <td className="px-3 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
          node.role === 'master'
            ? 'bg-violet-100 text-violet-700 border border-violet-200'
            : 'bg-slate-100 text-slate-600 border border-slate-200'
        }`}>
          {node.role === 'master' ? '★ Master' : 'Worker'}
        </span>
      </td>

      {/* Status */}
      <td className="px-3 py-3">
        <StatusBadge status={node.status} type="node" />
      </td>

      {/* CPU bar */}
      <td className="px-3 py-3 w-36">
        <MetricBar value={cpu} height="h-1.5" />
      </td>

      {/* RAM bar */}
      <td className="px-3 py-3 w-36">
        <MetricBar value={ram} height="h-1.5" />
      </td>

      {/* Tasks */}
      <td className="px-3 py-3 text-center">
        <span className={`font-bold text-sm ${
          (node.current_tasks_count ?? 0) > 0 ? 'text-orange-600' : 'text-slate-400'
        }`}>
          {node.current_tasks_count ?? 0}
        </span>
      </td>

      {/* Score */}
      <td className="px-3 py-3 text-center">
        <span className="text-sm font-mono text-slate-600">
          {node.current_score != null ? node.current_score.toFixed(2) : '—'}
        </span>
      </td>

      {/* Heartbeat */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5 text-xs">
          {stale && <AlertTriangle size={11} className="text-amber-500 shrink-0" />}
          <span className={stale ? 'text-amber-600 font-medium' : 'text-slate-400'}>
            {timeAgo(hb)}
          </span>
        </div>
      </td>

      {/* Action */}
      <td className="px-3 py-3 text-right">
        <ChevronRight size={15} className="text-slate-300 group-hover:text-blue-500 transition-colors ml-auto" />
      </td>
    </tr>
  );
}

export default function ClusterDashboard() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [tick, setTick] = useState(0);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useClusterStats();
  const { data: nodesData, isLoading: nodesLoading, isError: nodesError, refetch: refetchNodes } = useNodes(filters);

  const nodes = nodesData?.items ?? [];

  // Auto-refresh every 4s
  useEffect(() => {
    const t = setInterval(() => {
      refetchStats();
      refetchNodes();
      setTick((n) => n + 1);
    }, 4000);
    return () => clearInterval(t);
  }, [refetchStats, refetchNodes]);

  const ns = stats?.nodes ?? {};
  const ts = stats?.tasks ?? {};

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Vue d'ensemble du Cluster</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Surveillance en temps réel · Rafraîchissement automatique toutes les 4s
          </p>
        </div>
        <button
          onClick={() => { refetchStats(); refetchNodes(); }}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
        >
          <RefreshCw size={13} />
          Rafraîchir
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {statsLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl skeleton" />
          ))
        ) : (
          <>
            <StatCard
              label="Nœuds actifs"
              value={ns.actifs ?? 0}
              icon={<CheckCircle2 size={16} />}
              color="green"
              sub={`sur ${ns.total ?? 0} total`}
            />
            <StatCard
              label="Surchargés"
              value={ns.surcharges ?? 0}
              icon={<Zap size={16} />}
              color="orange"
              sub="charge élevée"
            />
            <StatCard
              label="En panne"
              value={ns.en_panne ?? 0}
              icon={<XCircle size={16} />}
              color="red"
              sub="hors ligne"
            />
            <StatCard
              label="Maintenance"
              value={ns.en_maintenance ?? 0}
              icon={<Wrench size={16} />}
              color="slate"
              sub="suspendus"
            />
            <StatCard
              label="Tâches en cours"
              value={ts.en_cours ?? 0}
              icon={<Activity size={16} />}
              color="blue"
              sub="exécution active"
            />
            <StatCard
              label="En attente"
              value={ts.en_attente ?? 0}
              icon={<Clock size={16} />}
              color="violet"
              sub="file d'attente"
            />
          </>
        )}
      </div>

      {/* Node table */}
      <Card>
        <CardHeader
          title="Nœuds du Cluster"
          subtitle={`${nodes.length} nœud${nodes.length !== 1 ? 's' : ''} affiché${nodes.length !== 1 ? 's' : ''}`}
          action={
            <div className="flex items-center gap-2">
              <select
                value={filters.role ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value || undefined }))}
                className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Tous les rôles</option>
                <option value="worker">Worker</option>
                <option value="master">Master</option>
              </select>
              <select
                value={filters.status ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
                className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Tous les statuts</option>
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
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg skeleton" />
              ))}
            </div>
          </CardBody>
        )}

        {nodesError && !nodesLoading && (
          <CardBody>
            <div className="text-center py-8">
              <XCircle size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm mb-3">Impossible de charger les nœuds</p>
              <button
                onClick={() => refetchNodes()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Réessayer
              </button>
            </div>
          </CardBody>
        )}

        {!nodesLoading && !nodesError && nodes.length === 0 && (
          <CardBody>
            <div className="text-center py-12">
              <Server size={40} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Aucun nœud enregistré dans le cluster</p>
              <p className="text-slate-300 text-xs mt-1">
                Les nœuds rejoignent le cluster automatiquement via l'agent C
              </p>
            </div>
          </CardBody>
        )}

        {!nodesLoading && !nodesError && nodes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nœud</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rôle</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">CPU</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">RAM</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tâches</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Heartbeat</th>
                  <th className="px-3 py-2.5 w-8" />
                </tr>
              </thead>
              <tbody>
                {nodes.map((node) => (
                  <NodeRow
                    key={node.uuid}
                    node={node}
                    onClick={() => navigate(`/cluster/nodes/${node.uuid}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Cluster topology mini-map */}
      {!nodesLoading && nodes.length > 0 && (
        <Card>
          <CardHeader title="Topologie du Cluster" subtitle="Vue schématique des nœuds" />
          <CardBody>
            <div className="flex flex-wrap gap-3">
              {nodes.map((node) => {
                const cpu = node.current_cpu_usage ?? 0;
                const ram = node.current_ram_usage ?? 0;
                const isMaster = node.role === 'master';
                const statusColor =
                  node.status === 'actif' ? 'border-emerald-400 bg-emerald-50' :
                  node.status === 'surcharge' ? 'border-amber-400 bg-amber-50' :
                  node.status === 'en_panne' ? 'border-red-400 bg-red-50' :
                  'border-slate-300 bg-slate-50';

                return (
                  <div
                    key={node.uuid}
                    onClick={() => navigate(`/cluster/nodes/${node.uuid}`)}
                    className={`card-hover cursor-pointer border-2 rounded-xl p-3 min-w-[140px] ${statusColor} ${isMaster ? 'ring-2 ring-violet-400/50' : ''}`}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <Server size={13} className={isMaster ? 'text-violet-600' : 'text-slate-500'} />
                      <span className="text-xs font-bold text-slate-700 truncate">
                        {node.hostname ?? node.uuid?.slice(0, 8)}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 w-5">CPU</span>
                        <div className="flex-1 bg-slate-200 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full ${cpu > 0.85 ? 'bg-red-500' : cpu > 0.65 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${(cpu * 100).toFixed(0)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 w-7 text-right">{(cpu*100).toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 w-5">RAM</span>
                        <div className="flex-1 bg-slate-200 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full ${ram > 0.85 ? 'bg-red-500' : ram > 0.65 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${(ram * 100).toFixed(0)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 w-7 text-right">{(ram*100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <StatusBadge status={node.status} type="node" />
                      {(node.current_tasks_count ?? 0) > 0 && (
                        <span className="text-[10px] font-bold text-orange-600">
                          {node.current_tasks_count} tâche{node.current_tasks_count > 1 ? 's' : ''}
                        </span>
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
