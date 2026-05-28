import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from 'src/api/client';

export const useClusterStats = () =>
  useQuery({
    queryKey: ['cluster-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/api/nodes/stats');
      // Retourne { nodes: { total, actifs, surcharges, en_panne, en_maintenance }, tasks: { en_cours, en_attente } }
      return res.data.data;
    },
    refetchInterval: 4000,
  });

export const useNodes = (filters = {}) =>
  useQuery({
    queryKey: ['nodes', filters],
    queryFn: async () => {
      const res = await apiClient.get('/api/nodes/', {
        params: { per_page: 50, ...filters },
      });
      // Retourne { items, total, page, per_page, pages }
      return res.data.data;
    },
    refetchInterval: 4000,
  });

export const useNode = (uuid) =>
  useQuery({
    queryKey: ['node', uuid],
    queryFn: async () => {
      const res = await apiClient.get(`/api/nodes/${uuid}`);
      // Retourne l'objet node avec recent_heartbeats[]
      return res.data.data;
    },
    refetchInterval: 3000,
    enabled: !!uuid,
  });

export const useNodeHeartbeats = (uuid, limit = 500, enabled = true) =>
  useQuery({
    queryKey: ['node-heartbeats', uuid, limit],
    queryFn: async () => {
      const res = await apiClient.get(`/api/nodes/${uuid}/heartbeats`, {
        params: { limit },
      });
      // Retourne un tableau de HeartbeatRecord
      return res.data.data;
    },
    enabled: !!uuid && enabled,
  });

export const useNodeTasks = (uuid, status = '') =>
  useQuery({
    queryKey: ['node-tasks', uuid, status],
    queryFn: async () => {
      const params = {};
      if (status) params.status = status;
      const res = await apiClient.get(`/api/nodes/${uuid}/tasks`, { params });
      // Retourne un tableau de TacheAtomique
      return res.data.data;
    },
    enabled: !!uuid,
  });

export const useToggleMaintenance = () => {
  const qc = useQueryClient();
  return useMutation({
    // Accepte { uuid, enable } — envoie le flag enable dans le body
    mutationFn: ({ uuid, enable }) =>
      apiClient.patch(`/api/nodes/${uuid}/maintenance`, { enable }),
    onSuccess: (_, { uuid }) => {
      qc.invalidateQueries({ queryKey: ['nodes'] });
      qc.invalidateQueries({ queryKey: ['node', uuid] });
      qc.invalidateQueries({ queryKey: ['cluster-stats'] });
    },
  });
};

export const useRemoveNode = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uuid) => apiClient.delete(`/api/nodes/${uuid}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nodes'] });
      qc.invalidateQueries({ queryKey: ['cluster-stats'] });
    },
  });
};
