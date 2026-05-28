import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNode, useNodeHeartbeats, useNodeTasks, useToggleMaintenance, useRemoveNode } from 'src/hooks/useNodes';
import StatusBadge from 'src/components/ui/StatusBadge';
import MetricBar from 'src/components/ui/MetricBar';
import ConfirmModal from 'src/components/ui/ConfirmModal';
import { useToast } from 'src/components/ui/Toast';

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <svg className="animate-spin h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium">{value ?? '—'}</span>
    </div>
  );
}

function ActiveTasksSection({ uuid }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useNodeTasks(uuid, 'en_cours');
  // data est un tableau directement après unwrap du hook
  const tasks = Array.isArray(data) ? data : [];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-medium hover:bg-gray-100"
      >
        <span>Tâches actives {tasks.length > 0 && `(${tasks.length})`}</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="p-4">
          {isLoading && <p className="text-gray-400 text-sm">Chargement…</p>}
          {!isLoading && tasks.length === 0 && <p className="text-gray-400 text-sm">Aucune tâche active.</p>}
          {!isLoading && tasks.length > 0 && (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="text-left py-1">ID</th>
                  <th className="text-left py-1">Fonction</th>
                  <th className="text-left py-1">Statut</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td className="py-1 font-mono">{t.id?.slice(0, 8)}…</td>
                    <td className="py-1">{t.function_name ?? '—'}</td>
                    <td className="py-1"><StatusBadge status={t.status} type="task" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
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
  // Charger l'historique long uniquement quand l'utilisateur le demande
  const { data: heartbeatsData } = useNodeHeartbeats(uuid, 500, showLongHistory);
  const toggleMaintenance = useToggleMaintenance();
  const removeNode = useRemoveNode();

  if (isLoading) return <Spinner />;
  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-3">Impossible de charger le nœud.</p>
        <button onClick={() => refetch()} className="px-4 py-2 border border-black rounded text-sm">Réessayer</button>
      </div>
    );
  }

  const n = node ?? {};
  const profile = n.profile ?? {};

  // Graphe court : 10 derniers heartbeats du détail nœud (recent_heartbeats)
  const recentHeartbeats = (n.recent_heartbeats ?? []).map((hb, i) => ({
    name: `HB-${i + 1}`,
    cpu: ((hb.cpu_usage ?? 0) * 100).toFixed(1),
    ram: ((hb.ram_usage ?? 0) * 100).toFixed(1),
  }));

  // Graphe long : historique complet (tableau après unwrap du hook)
  const longHistory = (Array.isArray(heartbeatsData) ? heartbeatsData : []).map((hb) => ({
    name: new Date(hb.received_at).toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }),
    cpu: ((hb.cpu_usage ?? 0) * 100).toFixed(1),
    ram: ((hb.ram_usage ?? 0) * 100).toFixed(1),
  }));

  const chartData = showLongHistory ? longHistory : recentHeartbeats;

  const handleMaintenance = async () => {
    setShowMaintModal(false);
    const enable = n.status !== 'en_maintenance';
    try {
      await toggleMaintenance.mutateAsync({ uuid, enable });
      addToast(
        enable ? 'Nœud mis en maintenance.' : 'Nœud réactivé.',
        'success'
      );
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

  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate('/cluster')} className="text-sm text-gray-500 hover:text-black mb-4 flex items-center gap-1">
        ← Retour au cluster
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold font-mono">{n.hostname ?? uuid}</h2>
          <p className="text-gray-400 text-xs font-mono">{uuid}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={n.status} type="node" />
          <div className="flex gap-2">
            <button
              onClick={() => setShowMaintModal(true)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100"
            >
              {n.status === 'en_maintenance' ? 'Réactiver' : 'Maintenance'}
            </button>
            <button
              onClick={() => setShowRemoveModal(true)}
              className="px-3 py-1.5 border border-[#dc2626] text-[#dc2626] rounded text-sm hover:bg-red-50"
            >
              Retirer du cluster
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Identité */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3 text-gray-700 uppercase tracking-wide">Identité</h3>
          <InfoRow label="IP" value={n.ip} />
          <InfoRow label="Hostname" value={n.hostname} />
          <InfoRow label="Rôle" value={n.role} />
          <InfoRow
            label="Enregistré le"
            value={n.registered_at ? new Date(n.registered_at).toLocaleString('fr-FR') : '—'}
          />
        </div>

        {/* Profil matériel — champs du modèle NodeProfile */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3 text-gray-700 uppercase tracking-wide">Profil matériel</h3>
          <InfoRow label="CPU cœurs" value={profile.cpu_cores} />
          <InfoRow
            label="Fréquence CPU"
            value={profile.cpu_freq_mhz != null ? `${profile.cpu_freq_mhz} MHz` : null}
          />
          <InfoRow label="Architecture" value={profile.arch_cpu} />
          <InfoRow
            label="RAM totale"
            value={profile.ram_total_mb != null ? `${profile.ram_total_mb} Mo` : null}
          />
          <InfoRow
            label="RAM disponible"
            value={profile.ram_available_mb != null ? `${profile.ram_available_mb} Mo` : null}
          />
          <InfoRow
            label="Stockage"
            value={profile.storage_total_gb != null ? `${profile.storage_total_gb} Go` : null}
          />
          <InfoRow label="OS" value={profile.os_info} />
          <InfoRow
            label="Latence réseau"
            value={profile.network_latency_ms != null ? `${profile.network_latency_ms} ms` : null}
          />
        </div>
      </div>

      {/* Métriques temps réel */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold mb-3 text-gray-700 uppercase tracking-wide">Métriques temps réel</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">CPU</p>
            <MetricBar value={n.current_cpu_usage ?? 0} />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">RAM</p>
            <MetricBar value={n.current_ram_usage ?? 0} />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Tâches actives</p>
            <p className="text-lg font-bold">{n.current_tasks_count ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Score d'élection</p>
            <p className="text-lg font-bold">{n.current_score?.toFixed(3) ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Historique CPU / RAM */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Historique CPU / RAM</h3>
          <button
            onClick={() => setShowLongHistory((v) => !v)}
            className="text-xs border border-gray-300 px-2 py-1 rounded hover:bg-gray-100"
          >
            {showLongHistory ? 'Afficher 10 derniers' : 'Voir 30 min'}
          </button>
        </div>
        {chartData.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">Aucune donnée disponible.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend />
              <Line type="monotone" dataKey="cpu" stroke="#ea580c" strokeWidth={2} dot={false} name="CPU" />
              <Line type="monotone" dataKey="ram" stroke="#16a34a" strokeWidth={2} dot={false} name="RAM" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <ActiveTasksSection uuid={uuid} />

      <ConfirmModal
        isOpen={showMaintModal}
        title={n.status === 'en_maintenance' ? 'Réactiver le nœud' : 'Mettre en maintenance'}
        message={
          n.status === 'en_maintenance'
            ? 'Le nœud sera réactivé et pourra recevoir de nouvelles tâches.'
            : 'Le nœud sera mis en maintenance. Ses tâches actives seront migrées.'
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
