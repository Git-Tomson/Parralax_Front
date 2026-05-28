import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProgramme, useProgrammeTasks, useProgrammeLogs, useSubmitProgramme, useDeleteProgramme } from 'src/hooks/useTasks';
import { apiClient } from 'src/api/client';
import { API_BASE_URL } from 'src/config/api';
import { getAccessToken } from 'src/api/authStore';
import StatusBadge from 'src/components/ui/StatusBadge';
import ProgressBar from 'src/components/ui/ProgressBar';
import ConfirmModal from 'src/components/ui/ConfirmModal';
import { useToast } from 'src/components/ui/Toast';

function Spinner({ label }) {
  return (
    <div className="flex items-center gap-2 text-gray-500 text-sm">
      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      {label}
    </div>
  );
}

function SubtasksTab({ programmeId }) {
  const { data, isLoading, isError, refetch } = useProgrammeTasks(programmeId);
  // Le hook retourne directement le tableau de TacheAtomique
  const tasks = Array.isArray(data) ? data : [];

  if (isLoading) return <div className="py-8 flex justify-center"><Spinner label="Chargement…" /></div>;
  if (isError) return (
    <div className="py-8 text-center">
      <p className="text-gray-500 mb-2">Erreur de chargement.</p>
      <button onClick={() => refetch()} className="px-3 py-1 border rounded text-sm">Réessayer</button>
    </div>
  );
  if (!tasks.length) return <p className="text-gray-400 py-6 text-center">Aucune sous-tâche.</p>;

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
            <th className="text-left px-3 py-2 text-gray-600 font-medium">Durée</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tasks.map((t) => (
            <tr key={t.id ?? t.annotation_id} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-mono text-xs">{t.function_name ?? '—'}</td>
              <td className="px-3 py-2 text-gray-500 text-xs">{t.annotation_id ?? '—'}</td>
              <td className="px-3 py-2"><StatusBadge status={t.status} type="task" /></td>
              <td className="px-3 py-2 text-gray-500 font-mono text-xs">{t.worker_node_uuid ?? '—'}</td>
              <td className="px-3 py-2 text-gray-500">{t.attempts != null ? `${t.attempts}/${t.max_attempts ?? '?'}` : '—'}</td>
              <td className="px-3 py-2 text-gray-500">{t.duration_ms ? `${t.duration_ms}ms` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LogsTab({ programmeId }) {
  const { data, isLoading, isError, refetch } = useProgrammeLogs(programmeId);
  const logs = typeof data === 'string' ? data : data?.logs ?? '';

  if (isLoading) return <div className="py-8 flex justify-center"><Spinner label="Chargement des logs…" /></div>;
  if (isError) return (
    <div className="py-8 text-center">
      <p className="text-gray-500 mb-2">Erreur de chargement des logs.</p>
      <button onClick={() => refetch()} className="px-3 py-1 border rounded text-sm">Réessayer</button>
    </div>
  );

  return (
    <pre className="bg-gray-100 text-xs font-mono p-4 rounded overflow-auto max-h-96 whitespace-pre-wrap">
      {logs || 'Aucun log disponible.'}
    </pre>
  );
}

export default function ProgrammeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [tab, setTab] = useState('subtasks');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data: programme, isLoading, isError, refetch } = useProgramme(id);
  const submitMutation = useSubmitProgramme();
  const deleteMutation = useDeleteProgramme();

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner label="Chargement…" /></div>;
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
  const pct = progress.percent ?? p.progress_percent ?? null;
  const done = progress.done ?? p.tasks_done ?? null;
  const total = progress.total ?? p.tasks_total ?? null;
  const TERMINAL_STATUSES = new Set(['termine', 'echec', 'annule']);

  const handleSubmit = async () => {
    try {
      await submitMutation.mutateAsync(id);
      addToast('Programme soumis.', 'success');
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
      if (!res.ok) throw new Error('Erreur de téléchargement');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resultats_${p.name ?? id}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      addToast('Erreur lors du téléchargement des résultats.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-500 hover:text-black mb-4 flex items-center gap-1">
        ← Retour
      </button>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold">{p.name}</h2>
            <p className="text-gray-500 text-sm mt-0.5">{p.original_filename ?? p.file_name ?? '—'}</p>
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

        <div className="flex flex-wrap gap-2">
          {p.status === 'soumis' && (
            <button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="px-4 py-1.5 bg-black text-white rounded text-sm hover:bg-gray-800 disabled:opacity-50"
            >
              {submitMutation.isPending ? 'En cours…' : 'Lancer l\'exécution'}
            </button>
          )}
          {p.status === 'en_decomposition' && <Spinner label="Analyse en cours…" />}
          {p.status === 'en_cours' && <Spinner label="Exécution en cours…" />}
          {p.status === 'termine' && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-4 py-1.5 bg-[#16a34a] text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {downloading ? 'Téléchargement…' : 'Télécharger les résultats'}
            </button>
          )}
          {p.status === 'echec' && (
            <button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="px-4 py-1.5 bg-[#ea580c] text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50"
            >
              {submitMutation.isPending ? 'En cours…' : 'Réessayer'}
            </button>
          )}
          {(p.status === 'soumis' || p.status === 'echec' || p.status === 'annule') && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-1.5 border border-[#dc2626] text-[#dc2626] rounded text-sm hover:bg-red-50"
            >
              Supprimer
            </button>
          )}
        </div>
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
              {t === 'subtasks' ? 'Sous-tâches' : 'Logs'}
            </button>
          ))}
        </div>
        <div className="p-4">
          {tab === 'subtasks' ? <SubtasksTab programmeId={id} /> : <LogsTab programmeId={id} />}
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Supprimer le programme"
        message="Cette action est irréversible. Le programme et toutes ses données seront supprimés."
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
