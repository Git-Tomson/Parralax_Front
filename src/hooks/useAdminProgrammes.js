import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from 'src/api/client';

const ACTIVE_STATUSES = new Set(['soumis', 'en_decomposition', 'en_cours']);

export const useAdminProgrammes = (page = 1, status = '') =>
  useQuery({
    queryKey: ['admin-programmes', page, status],
    queryFn: async () => {
      const params = { page, per_page: 20 };
      if (status) params.status = status;
      const res = await apiClient.get('/api/programmes/', { params });
      // Retourne { items, total, page, per_page, pages }
      return res.data.data;
    },
    refetchInterval: 5000,
  });

export const useAdminProgramme = (id) =>
  useQuery({
    queryKey: ['admin-programme', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/programmes/${id}`);
      // Retourne programme + worker_nodes + execution_log
      return res.data.data;
    },
    refetchInterval: (query) =>
      ACTIVE_STATUSES.has(query.state.data?.status) ? 3000 : false,
    enabled: !!id,
  });

export const useAdminProgrammeTasks = (id) =>
  useQuery({
    queryKey: ['admin-programme-tasks', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/programmes/${id}/tasks`);
      // Retourne un tableau de TacheAtomique
      return res.data.data;
    },
    enabled: !!id,
  });

export const useCancelProgramme = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.post(`/api/programmes/${id}/cancel`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['admin-programmes'] });
      qc.invalidateQueries({ queryKey: ['admin-programme', id] });
    },
  });
};

export const useDeleteAdminProgramme = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/api/programmes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-programmes'] }),
  });
};

export const useRetryAdminProgramme = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.post(`/api/programmes/${id}/submit`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['admin-programmes'] });
      qc.invalidateQueries({ queryKey: ['admin-programme', id] });
    },
  });
};
