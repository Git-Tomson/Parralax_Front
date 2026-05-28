import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, Area, AreaChart,
} from 'recharts';
import { useNode, useNodeHeartbeats, useNodeTasks, useToggleMaintenance, useRemoveNode } from 'src/hooks/useNodes';
import StatusBadge from 'src/components/ui/StatusBadge';
import MetricBar from 'src/components/ui/MetricBar';
import Gauge from 'src/components/ui/Gauge';
import ConfirmModal from 'src/components/ui/ConfirmModal';
import { Card, CardHeader, CardBody } from 'src/components/ui/Card';
import { useToast } from 'src/components/ui/Toast';
import {
  ChevronLeft, Server, Cpu, MemoryStick, HardDrive, Network,
  Activity, Wrench, Trash2, RefreshCw, AlertTriangle,
  CheckCircle2, XCircle, Clock, Zap,
} from 'lucide-react';

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <svg className="animate-spin h-8 w-8 text-blue-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );
}

function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className={`text-sm font-semibold text-slate-800 ${mono ? 'font-mono text-xs' : ''}`}>
        {value ?? <span className="text-slate-300">—</span>}
      </span>
    </div>
  );
}

function ActiveTasksSection({ uuid }) {
  const [open, setOpen] = useState(true);
  const { data, isLoading } = useNodeTasks(uuid, 'en_cours');
  const tasks = Array.isArray(data) ? data : [];

  return (
    <Card>
      <CardHeader
        title={`Tâches actives${tasks.length > 0 ? ` (${tasks.length})` : ''}`}
        action={
          <button
            onClick={() => setOpen((o) => !o)}
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
          >
            {open ? '▲ Réduire' : '▼ Afficher'}
          </button>
        }
      />
      {open && (
        <CardBody>
          {isLoading && <div className="text-slate-400 text-sm text-center py-4">Chargement…</div>}
          {!isLoading && tasks.length === 0 && (
            <div className="text-center py-6">
              <CheckCircle2 size={24} className="text-emerald-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Aucune tâche active sur ce nœud</p>
            </div>
          )}
          {!isLoading && tasks.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fonction</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tentatives</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-2 font-mono text-xs text-slate-500">{t.id?.slice(0, 8)}…</td>
                      <td className="px-3 py-2 text-slate-700 font-medium">{t.function_name ?? '—'}</td>
                      <td className="px-3 py-2"><StatusBadge status={t.status} type="task" /></td>
                      <td className="px-3 py-2 text-slate-500 text-xs">{t.attempts ?? 0}/{t.max_attempts ?? 3}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      )}
    </Card>
  );
}

export default function NodeDetailPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showLongHistory, setShowLongHistory] = useState(false);

  const { data: node, isLoading, isError, refetch } = useNode(uuid);
  const { data: heartbeatsData } = useNodeHeartbeats(uuid, 500, showLongHistory);
  const toggleMaintenance = useToggleMaintenance();
  const removeNode = useRemoveNode();

  if (isLoading) return <Spinner />;
  if (isError) {
    return (
      <div className="text-center py-16">
        <XCircle size={40} className="text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 mb-4">Impossible de charger le nœud</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const n = node ?? {};
  const profile = n.profile ?? {};

  const recentHeartbeats = (n.recent_heartbeats ?? []).map((hb, i) => ({
    name: `#${i + 1}`,
    cpu: parseFloat(((hb.cpu_usage ?? 0) * 100).toFixed(1)),
    ram: parseFloat(((hb.ram_usage ?? 0) * 100).toFixed(1)),
  }));

  const longHistory = (Array.isArray(heartbeatsData) ? heartbeatsData : []).map((hb) => ({
    name: new Date(hb.received_at).toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }),
    cpu: parseFloat(((hb.cpu_usage ?? 0) * 100).toFixed(1)),
    ram: parseFloat(((hb.ram_usage ?? 0) * 100).toFixed(1)),
  }));

  const chartData = showLongHistory ? longHistory : recentHeartbeats;

  const handleMaintenance = async () => {
    setShowMaintModal(false);
    const enable = n.status !== 'en_maintenance';
    try {
      await toggleMaintenance.mutateAsync({ uuid, enable });
      addToast(enable ? 'Nœud mis en maintenance.' : 'Nœud réactivé.', 'success');
    } catch {
      addToast('Erreur lors du changement de statut.', 'error');
    }
  };

  const handleRemove = async () => {
    setShowRemoveModal(false);
    try {
      await removeNode.mutateAsync(uuid);
      addToast('Nœud retiré du cluster.', 'success');
      navigate('/cluster');
    } catch {
      addToast('Erreur lors du retrait du nœud.', 'error');
    }
  };

  const cpu = n.current_cpu_usage ?? 0;
  const ram = n.current_ram_usage ?? 0;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Back button */}
      <button
        onClick={() => navigate('/cluster')}
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm transition-colors"
      >
        <ChevronLeft size={15} />
        Retour au cluster
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Node icon */}
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
              n.status === 'actif' ? 'bg-emerald-100' :
              n.status === 'en_panne' ? 'bg-red-100' :
              n.status === 'surcharge' ? 'bg-amber-100' :
              'bg-slate-100'
            }`}>
              <Server size={24} className={
                n.status === 'actif' ? 'text-emerald-600' :
                n.status === 'en_panne' ? 'text-red-500' :
                n.status === 'surcharge' ? 'text-amber-600' :
                'text-slate-400'
              } />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-slate-900 font-mono">
                  {n.hostname ?? uuid}
                </h1>
                <StatusBadge status={n.status} type="node" />
                {n.role === 'master' && (
                  <span className="px-2 py-0.5 bg-violet-100 text-violet-700 border border-violet-200 rounded-full text-xs font-bold">
                    ★ Master
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs font-mono">{uuid}</p>
              <p className="text-slate-500 text-xs mt-0.5">
                IP: <span className="font-mono font-medium text-slate-700">{n.ip ?? '—'}</span>
                {n.registered_at && (
                  <> · Enregistré le {new Date(n.registered_at).toLocaleDateString('fr-FR')}</>
                )}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => refetch()}
              className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => setShowMaintModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Wrench size={13} />
              {n.status === 'en_maintenance' ? 'Réactiver' : 'Maintenance'}
            </button>
            <button
              onClick={() => setShowRemoveModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} />
              Retirer
            </button>
          </div>
        </div>
      </div>

      {/* Metrics gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="flex flex-col items-center py-5">
            <Gauge value={cpu} label="CPU" size={90} />
            <div className="w-full mt-3">
              <MetricBar value={cpu} height="h-1" showPercent={false} />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex flex-col items-center py-5">
            <Gauge value={ram} label="RAM" size={90} />
            <div className="w-full mt-3">
              <MetricBar value={ram} height="h-1" showPercent={false} />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex flex-col items-center justify-center py-5 gap-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              (n.current_tasks_count ?? 0) > 0 ? 'bg-orange-100' : 'bg-slate-100'
            }`}>
              <Activity size={20} className={(n.current_tasks_count ?? 0) > 0 ? 'text-orange-600' : 'text-slate-400'} />
            </div>
            <p className="text-3xl font-black text-slate-800">{n.current_tasks_count ?? 0}</p>
            <p className="text-xs text-slate-500">Tâches actives</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex flex-col items-center justify-center py-5 gap-2">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Zap size={20} className="text-blue-600" />
            </div>
            <p className="text-3xl font-black text-slate-800">
              {n.current_score != null ? n.current_score.toFixed(2) : '—'}
            </p>
            <p className="text-xs text-slate-500">Score d'élection</p>
          </CardBody>
        </Card>
      </div>

      {/* Identity + Hardware profile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Identité du nœud" />
          <CardBody>
            <InfoRow label="Hostname" value={n.hostname} />
            <InfoRow label="Adresse IP" value={n.ip} mono />
            <InfoRow label="UUID" value={uuid?.slice(0, 16) + '…'} mono />
            <InfoRow label="Rôle" value={n.role} />
            <InfoRow
              label="Enregistré le"
              value={n.registered_at ? new Date(n.registered_at).toLocaleString('fr-FR') : null}
            />
            <InfoRow
              label="Dernier heartbeat"
              value={n.last_heartbeat_at
                ? new Date(n.last_heartbeat_at).toLocaleTimeString('fr-FR')
                : null
              }
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Profil matériel" />
          <CardBody>
            <InfoRow
              label="CPU"
              value={profile.cpu_cores ? `${profile.cpu_cores} cœurs · ${profile.cpu_freq_mhz ?? '?'} MHz` : null}
            />
            <InfoRow label="Architecture" value={profile.arch_cpu} />
            <InfoRow
              label="RAM totale"
              value={profile.ram_total_mb ? `${profile.ram_total_mb} Mo` : null}
            />
            <InfoRow
              label="RAM disponible"
              value={profile.ram_available_mb ? `${profile.ram_available_mb} Mo` : null}
            />
            <InfoRow
              label="Stockage"
              value={profile.storage_total_gb
                ? `${profile.storage_total_gb} Go (${profile.storage_available_gb ?? '?'} Go libre)`
                : null
              }
            />
            <InfoRow
              label="Latence réseau"
              value={profile.network_latency_ms != null ? `${profile.network_latency_ms} ms` : null}
            />
            <InfoRow label="OS" value={profile.os_info} />
          </CardBody>
        </Card>
      </div>

      {/* CPU/RAM history chart */}
      <Card>
        <CardHeader
          title="Historique CPU / RAM"
          subtitle={showLongHistory ? 'Historique complet (30 min)' : '10 derniers heartbeats'}
          action={
            <button
              onClick={() => setShowLongHistory((v) => !v)}
              className="text-xs border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors flex items-center gap-1.5"
            >
              <Clock size={11} />
              {showLongHistory ? '10 derniers' : 'Voir 30 min'}
            </button>
          }
        />
        <CardBody>
          {chartData.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              <Activity size={24} className="mx-auto mb-2 text-slate-300" />
              Aucune donnée disponible
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span className="text-xs text-slate-600">{v}</span>}
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#colorCpu)"
                  dot={false}
                  name="CPU"
                />
                <Area
                  type="monotone"
                  dataKey="ram"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#colorRam)"
                  dot={false}
                  name="RAM"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>

      {/* Active tasks */}
      <ActiveTasksSection uuid={uuid} />

      {/* Modals */}
      <ConfirmModal
        isOpen={showMaintModal}
        title={n.status === 'en_maintenance' ? 'Réactiver le nœud' : 'Mettre en maintenance'}
        message={
          n.status === 'en_maintenance'
            ? 'Le nœud sera réactivé et pourra recevoir de nouvelles tâches.'
            : 'Le nœud sera mis en maintenance. Ses tâches actives seront migrées vers d\'autres nœuds.'
        }
        onConfirm={handleMaintenance}
        onCancel={() => setShowMaintModal(false)}
      />

      <ConfirmModal
        isOpen={showRemoveModal}
        title="Retirer le nœud du cluster"
        message="Cette action est irréversible. Le nœud devra se réenregistrer pour rejoindre le cluster."
        onConfirm={handleRemove}
        onCancel={() => setShowRemoveModal(false)}
      />
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-slate-700">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: <strong>{p.value}%</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
}
