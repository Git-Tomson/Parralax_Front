import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClusterStats, useNodes } from 'src/hooks/useNodes';
import StatusBadge from 'src/components/ui/StatusBadge';
import MetricBar from 'src/components/ui/MetricBar';

function StatCard({ label, value, color }) {
  const colors = {
    green: 'border-l-[#16a34a] bg-green-50',
    orange: 'border-l-[#ea580c] bg-orange-50',
    red: 'border-l-[#dc2626] bg-red-50',
    gray: 'border-l-gray-400 bg-gray-50',
    black: 'border-l-black bg-gray-100',
  };
  return (
    <div className={`border border-gray-200 border-l-4 rounded-lg p-4 ${colors[color] ?? colors.gray}`}>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-3xl font-bold mt-1">{value ?? '—'}</p>
    </div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `il y a ${diff}s`;
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  return `il y a ${Math.floor(diff / 3600)}h`;
}

export default function ClusterDashboard() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});

  const { data: stats, isLoading: statsLoading } = useClusterStats();
  const { data: nodesData, isLoading: nodesLoading, isError: nodesError, refetch } = useNodes(filters);

  const nodes = nodesData?.nodes ?? nodesData?.items ?? [];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Tableau de bord du cluster</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statsLoading ? (
          <div className="col-span-6 text-center py-4 text-gray-400 text-sm">Chargement des stats…</div>
        ) : (
          <>
            <StatCard label="Nœuds actifs" value={stats?.actif ?? stats?.active} color="green" />
            <StatCard label="Surchargés" value={stats?.surcharge ?? stats?.overloaded} color="orange" />
            <StatCard label="En panne" value={stats?.en_panne ?? stats?.failed} color="red" />
            <StatCard label="Maintenance" value={stats?.en_maintenance ?? stats?.maintenance} color="gray" />
            <StatCard label="Tâches en cours" value={stats?.tasks_running ?? stats?.en_cours} color="black" />
            <StatCard label="Tâches en attente" value={stats?.tasks_pending ?? stats?.en_attente} color="gray" />
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filters.status ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="surcharge">Surchargé</option>
          <option value="en_panne">En panne</option>
          <option value="en_maintenance">Maintenance</option>
          <option value="eteint">Éteint</option>
        </select>
        <select
          value={filters.role ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value || undefined }))}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
        >
          <option value="">Tous les rôles</option>
          <option value="worker">Worker</option>
          <option value="master">Master</option>
        </select>
      </div>

      {nodesLoading && <div className="text-center py-12 text-gray-400">Chargement des nœuds…</div>}
      {nodesError && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-3">Impossible de charger les nœuds.</p>
          <button onClick={() => refetch()} className="px-4 py-2 border border-black rounded text-sm">Réessayer</button>
        </div>
      )}
      {!nodesLoading && !nodesError && nodes.length === 0 && (
        <p className="text-center py-12 text-gray-400">Aucun nœud enregistré.</p>
      )}
      {!nodesLoading && !nodesError && nodes.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 py-3 text-gray-600 font-medium">UUID</th>
                <th className="text-left px-3 py-3 text-gray-600 font-medium">IP</th>
                <th className="text-left px-3 py-3 text-gray-600 font-medium">Hostname</th>
                <th className="text-left px-3 py-3 text-gray-600 font-medium">Rôle</th>
                <th className="text-left px-3 py-3 text-gray-600 font-medium">Statut</th>
                <th className="text-left px-3 py-3 text-gray-600 font-medium w-32">CPU</th>
                <th className="text-left px-3 py-3 text-gray-600 font-medium w-32">RAM</th>
                <th className="text-left px-3 py-3 text-gray-600 font-medium">Tâches</th>
                <th className="text-left px-3 py-3 text-gray-600 font-medium">Score</th>
                <th className="text-left px-3 py-3 text-gray-600 font-medium">Heartbeat</th>
                <th className="text-left px-3 py-3 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {nodes.map((node) => {
                const hb = node.last_heartbeat_at;
                const hbAge = hb ? Math.floor((Date.now() - new Date(hb)) / 1000) : null;
                const stale = hbAge != null && hbAge > 5;
                return (
                  <tr key={node.uuid} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs text-gray-500">{node.uuid?.slice(0, 6) ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-xs">{node.ip_address ?? '—'}</td>
                    <td className="px-3 py-2">{node.hostname ?? '—'}</td>
                    <td className="px-3 py-2 capitalize">{node.role ?? '—'}</td>
                    <td className="px-3 py-2"><StatusBadge status={node.status} type="node" /></td>
                    <td className="px-3 py-2"><MetricBar value={node.cpu_usage ?? 0} /></td>
                    <td className="px-3 py-2"><MetricBar value={node.ram_usage ?? 0} /></td>
                    <td className="px-3 py-2 text-center">{node.active_tasks ?? 0}</td>
                    <td className="px-3 py-2 text-gray-500">{node.score?.toFixed(2) ?? '—'}</td>
                    <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                      {stale && <span title="Heartbeat tardif" className="mr-1">⚠️</span>}
                      {timeAgo(hb)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => navigate(`/cluster/nodes/${node.uuid}`)}
                        className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100"
                      >
                        Détail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
