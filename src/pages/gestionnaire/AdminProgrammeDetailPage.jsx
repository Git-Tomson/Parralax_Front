import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAdminProgramme, useAdminProgrammeTasks, useCancelProgramme } from 'src/hooks/useAdminProgrammes';
import StatusBadge from 'src/components/ui/StatusBadge';
import ProgressBar from 'src/components/ui/ProgressBar';
import ConfirmModal from 'src/components/ui/ConfirmModal';
import { useToast } from 'src/components/ui/Toast';
import { apiClient } from 'src/api/client';

const TERMINAL = new Set(['termine', 'echec', 'annule']);
const ACTIVE_STATUSES = new Set(['soumis', 'en_decomposition', 'en_cours']);

function SubtasksSection({ programmeId }) {
  const { data, isLoading } = useAdminProgrammeTasks(programmeId);
  // data est un tableau directement après unwrap du hook
  const tasks = Array.isArray(data) ? data : [];

  if (isLoading) return <p className="text-gray-400 text-sm py-4 text-center">Chargement…</p>;
  if (!tasks.length) return <p className="text-gray-400 text-sm py-4 text-center">Aucune sous-tâche.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-3 py-2 text-gray-600 font-medium">Fonction</th>
            <th className="text-left px-3 py-2 text-gray-600 font-medium">Annotation</th>
            <th className="text-left px-3 py-2 text-gray-600 font-medium">Statut</th>
            <th className="text-left px-3 py-2 text-gray-600 font-medium">Nœud</th>
            <th className="text-left px-3 py-2 text-gray-600 font-medium">Tentatives</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tasks.map((t) => (
            <tr key={t.id ?? t.annotation_id} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-mono text-xs">{t.function_name ?? '—'}</td>
              <td className="px-3 py-2 text-gray-500 text-xs">{t.annotation_id ?? '—'}</td>
              <td className="px-3 py-2"><StatusBadge status={t.status} type="task" /></td>
              <td className="px-3 py-2 font-mono text-xs">
                {t.worker_node_uuid ? (
                  <Link to={`/cluster/nodes/${t.worker_node_uuid}`} className="text-black hover:underline">
                    {t.worker_node_uuid.slice(0, 8)}…
                  </Link>
                ) : '—'}
              </td>
              <td className="px-3 py-2 text-gray-500">{t.attempts != null ? `${t.attempts}/${t.max_attempts ?? '?'}` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminProgrammeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [tab, setTab] = useState('subtasks');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { data: programme, isLoading, isError, refetch } = useAdminProgramme(id);
  const cancelMutation = useCancelProgramme();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <svg className="animate-spin h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-3">Impossible de charger le programme.</p>
        <button onClick={() => refetch()} className="px-4 py-2 border border-black rounded text-sm">Réessayer</button>
      </div>
    );
  }

  const p = programme ?? {};
  const progress = p.progress ?? {};
  const pct = progress.percent ?? null;
  const done = progress.done ?? null;
  const total = progress.total ?? null;
  const workerNodes = p.worker_nodes ?? [];
  const canCancel = !TERMINAL.has(p.status);

  const handleCancel = async () => {
    setShowCancelModal(false);
    try {
      await cancelMutation.mutateAsync(id);
      addToast('Programme annulé.', 'success');
    } catch {
      addToast('Erreur lors de l\'annulation.', 'error');
    }
  };

  // Les sous-tâches sont chargées via useAdminProgrammeTasks dans SubtasksSection
  const logs = p.execution_log ?? '';

  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate('/cluster/programmes')} className="text-sm text-gray-500 hover:text-black mb-4 flex items-center gap-1">
        ← Retour
      </button>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold">{p.name}</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              Propriétaire : {p.owner_id ?? p.owner ?? '—'} •{' '}
              {p.original_filename ?? p.file_name ?? '—'}
            </p>
          </div>
          <StatusBadge status={p.status} type="programme" />
        </div>

        {pct != null && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progression</span>
              <span>{done != null && total != null ? `${done}/${total} tâches` : `${pct.toFixed(0)}%`}</span>
            </div>
            <ProgressBar percent={pct} failed={p.status === 'echec'} />
          </div>
        )}

        {p.error_message && (
          <div className="bg-red-50 border border-[#dc2626] text-[#dc2626] text-sm px-3 py-2 rounded mb-4">
            <strong>Erreur :</strong> {p.error_message}
          </div>
        )}

        {workerNodes.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Nœuds workers</p>
            <div className="flex flex-wrap gap-2">
              {workerNodes.map((nodeUuid) => (
                <Link
                  key={nodeUuid}
                  to={`/cluster/nodes/${nodeUuid}`}
                  className="px-2 py-1 bg-gray-100 rounded font-mono text-xs hover:bg-gray-200 text-black"
                >
                  {nodeUuid.slice(0, 8)}…
                </Link>
              ))}
            </div>
          </div>
        )}

        {canCancel && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-4 py-1.5 border border-[#ea580c] text-[#ea580c] rounded text-sm hover:bg-orange-50"
          >
            Annuler le programme
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex border-b border-gray-200">
          {['subtasks', 'logs'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                tab === t ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black'
              }`}
            >
              {t === 'subtasks' ? 'Sous-tâches' : 'Logs complets'}
            </button>
          ))}
        </div>
        <div className="p-4">
          {tab === 'subtasks' ? (
            <SubtasksSection programmeId={id} />
          ) : (
            <pre className="bg-gray-100 text-xs font-mono p-4 rounded overflow-auto max-h-[500px] whitespace-pre-wrap">
              {logs || 'Aucun log disponible.'}
            </pre>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showCancelModal}
        title="Annuler le programme"
        message="L'exécution sera interrompue immédiatement. Cette action ne peut pas être annulée."
        onConfirm={handleCancel}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
}
