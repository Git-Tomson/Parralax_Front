import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyTasks, useDeleteProgramme } from 'src/hooks/useTasks';
import StatusBadge from 'src/components/ui/StatusBadge';
import ProgressBar from 'src/components/ui/ProgressBar';
import Pagination from 'src/components/ui/Pagination';
import ConfirmModal from 'src/components/ui/ConfirmModal';
import { useToast } from 'src/components/ui/Toast';

const TERMINAL = new Set(['termine', 'echec', 'annule']);

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

export default function ChercheurDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading, isError, refetch } = useMyTasks(page, statusFilter);
  const deleteMutation = useDeleteProgramme();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      addToast('Programme supprimé.', 'success');
    } catch {
      addToast('Erreur lors de la suppression.', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const tasks = data?.tasks ?? data?.items ?? [];
  const pagination = data?.pagination ?? {};

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Mes projets</h2>
        <button
          onClick={() => navigate('/programmes/import')}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 text-sm"
        >
          + Nouveau projet
        </button>
      </div>

      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
        >
          <option value="">Tous les statuts</option>
          <option value="soumis">Soumis</option>
          <option value="en_decomposition">En décomposition</option>
          <option value="en_cours">En cours</option>
          <option value="termine">Terminé</option>
          <option value="echec">Échec</option>
          <option value="annule">Annulé</option>
        </select>
        <button onClick={() => refetch()} className="ml-2 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100">
          Rafraîchir
        </button>
      </div>

      {isLoading && <Spinner />}
      {isError && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-3">Impossible de charger les projets.</p>
          <button onClick={() => refetch()} className="px-4 py-2 border border-black rounded text-sm hover:bg-gray-100">
            Réessayer
          </button>
        </div>
      )}

      {!isLoading && !isError && tasks.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>Aucun projet trouvé.</p>
          <button onClick={() => navigate('/programmes/import')} className="mt-3 px-4 py-2 bg-black text-white rounded text-sm">
            Importer un programme
          </button>
        </div>
      )}

      {!isLoading && !isError && tasks.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nom</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fichier</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Progression</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date upload</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map((task) => {
                const pct = task.progress?.percent ?? task.progress_percent ?? null;
                const canDelete = TERMINAL.has(task.status) || task.status === 'soumis';
                return (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{task.name}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">{task.original_filename ?? task.file_name ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={task.status} type="programme" /></td>
                    <td className="px-4 py-3 w-36">
                      {pct != null ? (
                        <div>
                          <ProgressBar percent={pct} />
                          <span className="text-xs text-gray-400">{pct.toFixed(0)}%</span>
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {task.created_at ? new Date(task.created_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/programmes/${task.id}`)}
                          className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100"
                        >
                          Voir
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => setDeleteTarget(task.id)}
                            className="px-3 py-1 border border-[#dc2626] text-[#dc2626] rounded text-xs hover:bg-red-50"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={pagination.page ?? page}
        pages={pagination.pages ?? 1}
        total={pagination.total ?? tasks.length}
        perPage={pagination.per_page ?? 20}
        onChange={setPage}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Supprimer le programme"
        message="Cette action est irréversible. Le programme et ses données seront définitivement supprimés."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
