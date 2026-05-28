import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyTasks, useDeleteProgramme } from 'src/hooks/useTasks';
import { useAuth } from 'src/context/AuthContext';
import StatusBadge from 'src/components/ui/StatusBadge';
import ProgressBar from 'src/components/ui/ProgressBar';
import Pagination from 'src/components/ui/Pagination';
import ConfirmModal from 'src/components/ui/ConfirmModal';
import StatCard from 'src/components/ui/StatCard';
import { Card, CardHeader, CardBody } from 'src/components/ui/Card';
import { useToast } from 'src/components/ui/Toast';
import {
  Plus, RefreshCw, Search, Trash2, Eye, ChevronRight,
  FolderCode, CheckCircle2, Clock, XCircle, Loader,
  Upload, BarChart2,
} from 'lucide-react';

const TERMINAL = new Set(['termine', 'echec', 'annule']);

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function EmptyState({ onImport }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <FolderCode size={28} className="text-blue-400" />
      </div>
      <h3 className="text-slate-700 font-semibold mb-1">Aucun projet trouvé</h3>
      <p className="text-slate-400 text-sm mb-5">
        Importez votre premier programme pour commencer.
      </p>
      <button
        onClick={onImport}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
      >
        <Upload size={15} />
        Importer un programme
      </button>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-2 p-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-14 rounded-lg skeleton" />
      ))}
    </div>
  );
}

export default function ChercheurDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
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

  const allItems = data?.items ?? [];
  const items = searchTerm
    ? allItems.filter((t) =>
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.original_filename ?? '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allItems;

  const pagination = data ?? {};

  // Compute mini-stats from loaded items
  const statCounts = allItems.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mes Projets</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Bienvenue, <span className="font-semibold text-slate-700">{user?.username}</span> —
            Gérez et suivez vos programmes de calcul
          </p>
        </div>
        <button
          onClick={() => navigate('/programmes/import')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus size={15} />
          Nouveau projet
        </button>
      </div>

      {/* Mini stats */}
      {!isLoading && allItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="En cours"
            value={statCounts['en_cours'] ?? 0}
            icon={<Loader size={16} />}
            color="orange"
          />
          <StatCard
            label="Terminés"
            value={statCounts['termine'] ?? 0}
            icon={<CheckCircle2 size={16} />}
            color="green"
          />
          <StatCard
            label="En attente"
            value={(statCounts['soumis'] ?? 0) + (statCounts['en_decomposition'] ?? 0)}
            icon={<Clock size={16} />}
            color="blue"
          />
          <StatCard
            label="Échecs"
            value={statCounts['echec'] ?? 0}
            icon={<XCircle size={16} />}
            color="red"
          />
        </div>
      )}

      {/* Project list */}
      <Card>
        <CardHeader
          title="Liste des projets"
          subtitle={`${pagination.total ?? allItems.length} projet${(pagination.total ?? allItems.length) !== 1 ? 's' : ''} au total`}
          action={
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher…"
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
                />
              </div>
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Tous</option>
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

        {isLoading && <LoadingRows />}

        {isError && !isLoading && (
          <CardBody>
            <div className="text-center py-8">
              <XCircle size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm mb-3">Impossible de charger les projets</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Réessayer
              </button>
            </div>
          </CardBody>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <EmptyState onImport={() => navigate('/programmes/import')} />
        )}

        {!isLoading && !isError && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Projet</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">Progression</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((task) => {
                  const pct = task.progress?.percent ?? task.progress_percent ?? null;
                  const canDelete = TERMINAL.has(task.status) || task.status === 'soumis';
                  const isRunning = task.status === 'en_cours' || task.status === 'en_decomposition';

                  return (
                    <tr
                      key={task.id}
                      className="group border-b border-slate-100 last:border-0 hover:bg-blue-50/30 transition-colors"
                    >
                      {/* Name + filename */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isRunning ? 'bg-orange-100' :
                            task.status === 'termine' ? 'bg-emerald-100' :
                            task.status === 'echec' ? 'bg-red-100' :
                            'bg-slate-100'
                          }`}>
                            <FolderCode size={14} className={
                              isRunning ? 'text-orange-600' :
                              task.status === 'termine' ? 'text-emerald-600' :
                              task.status === 'echec' ? 'text-red-500' :
                              'text-slate-400'
                            } />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">{task.name}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[200px]">
                              {task.original_filename ?? task.file_name ?? '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <StatusBadge status={task.status} type="programme" />
                      </td>

                      {/* Progress */}
                      <td className="px-3 py-3 w-40">
                        {pct != null ? (
                          <div>
                            <ProgressBar
                              percent={pct}
                              failed={task.status === 'echec'}
                            />
                            <span className="text-xs text-slate-400 mt-0.5 block">
                              {pct.toFixed(0)}% complété
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-3 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {formatDate(task.uploaded_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/programmes/${task.id}`)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
                          >
                            <Eye size={12} />
                            Voir
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => setDeleteTarget(task.id)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={12} />
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
              total={pagination.total ?? items.length}
              perPage={pagination.per_page ?? 20}
              onChange={setPage}
            />
          </div>
        )}
      </Card>

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
