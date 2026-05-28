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
      return res.data;
    },
    refetchInterval: 5000,
  });

export const useAdminProgramme = (id) =>
  useQuery({
    queryKey: ['admin-programme', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/programmes/${id}`);
      return res.data;
    },
    refetchInterval: (query) =>
      ACTIVE_STATUSES.has(query.state.data?.status) ? 3000 : false,
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
