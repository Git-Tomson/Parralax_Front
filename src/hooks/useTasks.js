import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from 'src/api/client';

const ACTIVE_STATUSES = new Set(['soumis', 'en_decomposition', 'en_cours']);

export const useMyTasks = (page = 1, status = '') =>
  useQuery({
    queryKey: ['tasks', page, status],
    queryFn: async () => {
      const params = { page, per_page: 20 };
      if (status) params.status = status;
      const res = await apiClient.get('/api/tasks/', { params });
      // Retourne { items, total, page, per_page, pages }
      return res.data.data;
    },
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      return items.some((t) => ACTIVE_STATUSES.has(t.status)) ? 3000 : false;
    },
  });

export const useProgramme = (id) =>
  useQuery({
    queryKey: ['programme', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/tasks/${id}`, {
        params: { include_progress: true },
      });
      // Retourne l'objet programme avec progress inclus
      return res.data.data;
    },
    refetchInterval: (query) =>
      ACTIVE_STATUSES.has(query.state.data?.status) ? 3000 : false,
    enabled: !!id,
  });

export const useProgrammeTasks = (id) =>
  useQuery({
    queryKey: ['programme-tasks', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/tasks/${id}/tasks`);
      // Retourne un tableau de TacheAtomique
      return res.data.data;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const tasks = Array.isArray(query.state.data) ? query.state.data : [];
      const hasActive = tasks.some((t) =>
        ['en_attente', 'assignee', 'en_cours'].includes(t.status)
      );
      return hasActive ? 3000 : false;
    },
  });

export const useProgrammeLogs = (id) =>
  useQuery({
    queryKey: ['programme-logs', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/tasks/${id}/logs`);
      // Retourne { logs: "..." }
      return res.data.data;
    },
    enabled: !!id,
    refetchInterval: 4000,
  });

export const useImportProgramme = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData) =>
      apiClient.post('/api/tasks/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
};

export const useSubmitProgramme = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.post(`/api/tasks/${id}/submit`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['programme', id] });
      qc.invalidateQueries({ queryKey: ['programme-tasks', id] });
    },
  });
};

// Info sur le maître courant (accessible à tous les rôles)
export const useMasterNode = () =>
  useQuery({
    queryKey: ['master-node'],
    queryFn: async () => {
      const res = await apiClient.get('/api/nodes/master');
      return res.data.data;  // { master, controller, cluster_ready }
    },
    refetchInterval: 8000,
    retry: 1,
  });

export const useCancelOwnProgramme = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.post(`/api/tasks/${id}/cancel`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['programme', id] });
      qc.invalidateQueries({ queryKey: ['programme-tasks', id] });
    },
  });
};

export const useDeleteProgramme = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/api/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
};
