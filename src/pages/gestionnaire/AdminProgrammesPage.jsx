import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminProgrammes, useCancelProgramme } from 'src/hooks/useAdminProgrammes';
import StatusBadge from 'src/components/ui/StatusBadge';
import ProgressBar from 'src/components/ui/ProgressBar';
import Pagination from 'src/components/ui/Pagination';
import ConfirmModal from 'src/components/ui/ConfirmModal';
import { Card, CardHeader, CardBody } from 'src/components/ui/Card';
import { useToast } from 'src/components/ui/Toast';
import {
  RefreshCw, Eye, XCircle, FileCode2, Search, StopCircle,
  ChevronRight,
} from 'lucide-react';

const TERMINAL = new Set(['termine', 'echec', 'annule']);

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminProgrammesPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);

  const { data, isLoading, isError, refetch } = useAdminProgrammes(page, statusFilter);
  const cancelMutation = useCancelProgramme();

  const allProgrammes = data?.items ?? [];
  const programmes = search
    ? allProgrammes.filter((p) =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        String(p.owner_id ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : allProgrammes;
  const pagination = data ?? {};

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(cancelTarget);
      addToast('Programme annulé.', 'success');
    } catch {
      addToast("Erreur lors de l'annulation.", 'error');
    } finally {
      setCancelTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Programmes — Administration</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Supervision de tous les programmes soumis au cluster
          </p>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Liste des programmes"
          subtitle={`${pagination.total ?? allProgrammes.length} programme${(pagination.total ?? allProgrammes.length) !== 1 ? 's' : ''}`}
          action={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Tous les statuts</option>
                <option value="soumis">Soumis</option>
                <option value="en_decomposition">Décomposition</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="echec">Échec</option>
                <option value="annule">Annulé</option>
              </select>
              <button
                onClick={() => refetch()}
                className="p-1.5 border border-slate-200 rounded-md text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          }
        />

        {isLoading && (
          <CardBody>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg skeleton" />
              ))}
            </div>
          </CardBody>
        )}

        {isError && !isLoading && (
          <CardBody>
            <div className="text-center py-8">
              <XCircle size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm mb-3">Erreur de chargement</p>
              <button onClick={() => refetch()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Réessayer</button>
            </div>
          </CardBody>
        )}

        {!isLoading && !isError && programmes.length === 0 && (
          <CardBody>
            <div className="text-center py-12">
              <FileCode2 size={36} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Aucun programme trouvé</p>
            </div>
          </CardBody>
        )}

        {!isLoading && !isError && programmes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Programme</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Propriétaire</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">Progression</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Soumis</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {programmes.map((prog) => {
                  const pct = prog.progress?.percent ?? prog.progress_percent ?? null;
                  const canCancel = !TERMINAL.has(prog.status);
                  return (
                    <tr
                      key={prog.id}
                      className="group border-b border-slate-100 last:border-0 hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            prog.status === 'en_cours' ? 'bg-orange-100' :
                            prog.status === 'termine' ? 'bg-emerald-100' :
                            prog.status === 'echec' ? 'bg-red-100' : 'bg-slate-100'
                          }`}>
                            <FileCode2 size={13} className={
                              prog.status === 'en_cours' ? 'text-orange-600' :
                              prog.status === 'termine' ? 'text-emerald-600' :
                              prog.status === 'echec' ? 'text-red-500' : 'text-slate-400'
                            } />
                          </div>
                          <p className="font-semibold text-slate-800 truncate max-w-[180px]">{prog.name}</p>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-500 text-xs font-mono">
                        {prog.owner_id ?? prog.owner ?? '—'}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={prog.status} type="programme" />
                      </td>
                      <td className="px-3 py-3 w-36">
                        {pct != null ? (
                          <div>
                            <ProgressBar percent={pct} failed={prog.status === 'echec'} />
                            <span className="text-xs text-slate-400">{pct.toFixed(0)}%</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {formatDate(prog.submitted_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/cluster/programmes/${prog.id}`)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                          >
                            <Eye size={12} />
                            Voir
                          </button>
                          {canCancel && (
                            <button
                              onClick={() => setCancelTarget(prog.id)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-orange-200 text-orange-600 rounded-lg text-xs hover:bg-orange-50 transition-colors"
                            >
                              <StopCircle size={12} />
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

        {!isLoading && !isError && (pagination.pages ?? 1) > 1 && (
          <div className="px-5 py-3 border-t border-slate-100">
            <Pagination
              page={pagination.page ?? page}
              pages={pagination.pages ?? 1}
              total={pagination.total ?? programmes.length}
              perPage={pagination.per_page ?? 20}
              onChange={setPage}
            />
          </div>
        )}
      </Card>

      <ConfirmModal
        isOpen={!!cancelTarget}
        title="Annuler le programme"
        message="L'exécution sera interrompue. Les tâches en cours seront abandonnées."
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
