import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminProgrammes, useCancelProgramme } from 'src/hooks/useAdminProgrammes';
import StatusBadge from 'src/components/ui/StatusBadge';
import ProgressBar from 'src/components/ui/ProgressBar';
import Pagination from 'src/components/ui/Pagination';
import ConfirmModal from 'src/components/ui/ConfirmModal';
import { useToast } from 'src/components/ui/Toast';

const TERMINAL = new Set(['termine', 'echec', 'annule']);

export default function AdminProgrammesPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);

  const { data, isLoading, isError, refetch } = useAdminProgrammes(page, statusFilter);
  const cancelMutation = useCancelProgramme();

  // data = { items, total, page, per_page, pages } après unwrap dans le hook
  const programmes = data?.items ?? [];
  const pagination = data ?? {};

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(cancelTarget);
      addToast('Programme annulé.', 'success');
    } catch {
      addToast('Erreur lors de l\'annulation.', 'error');
    } finally {
      setCancelTarget(null);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Programmes — Vue gestionnaire</h2>

      <div className="flex gap-3 mb-4">
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
        <button onClick={() => refetch()} className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100">
          Rafraîchir
        </button>
      </div>

      {isLoading && <div className="text-center py-12 text-gray-400">Chargement…</div>}
      {isError && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-3">Erreur de chargement.</p>
          <button onClick={() => refetch()} className="px-4 py-2 border border-black rounded text-sm">Réessayer</button>
        </div>
      )}
      {!isLoading && !isError && programmes.length === 0 && (
        <p className="text-center py-12 text-gray-400">Aucun programme.</p>
      )}

      {!isLoading && !isError && programmes.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Nom</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Propriétaire</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Statut</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Progression</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Soumis le</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {programmes.map((prog) => {
                const pct = prog.progress?.percent ?? prog.progress_percent ?? null;
                const canCancel = !TERMINAL.has(prog.status);
                return (
                  <tr key={prog.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{prog.name}</td>
                    <td className="px-4 py-3 text-gray-500">{prog.owner_id ?? prog.owner ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={prog.status} type="programme" /></td>
                    <td className="px-4 py-3 w-32">
                      {pct != null ? (
                        <div>
                          <ProgressBar percent={pct} />
                          <span className="text-xs text-gray-400">{pct.toFixed(0)}%</span>
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {prog.submitted_at ? new Date(prog.submitted_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/cluster/programmes/${prog.id}`)}
                          className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100"
                        >
                          Voir
                        </button>
                        {canCancel && (
                          <button
                            onClick={() => setCancelTarget(prog.id)}
                            className="px-3 py-1 border border-[#ea580c] text-[#ea580c] rounded text-xs hover:bg-orange-50"
                          >
                            Annuler
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
        total={pagination.total ?? programmes.length}
        perPage={pagination.per_page ?? 20}
        onChange={setPage}
      />

      <ConfirmModal
        isOpen={!!cancelTarget}
        title="Annuler le programme"
        message="L'exécution sera interrompue. Cette action ne peut pas être annulée."
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
