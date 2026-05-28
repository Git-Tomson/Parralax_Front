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
      return res.data;
    },
  });

export const useProgramme = (id) =>
  useQuery({
    queryKey: ['programme', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/tasks/${id}`, {
        params: { include_progress: true },
      });
      return res.data;
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
      return res.data;
    },
    enabled: !!id,
  });

export const useProgrammeLogs = (id) =>
  useQuery({
    queryKey: ['programme-logs', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/tasks/${id}/logs`);
      return res.data;
    },
    enabled: !!id,
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
