import axios from 'axios';
import { API_BASE_URL } from 'src/config/api';
import { getAccessToken, setAccessToken } from 'src/api/authStore';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// ─── Utilitaire : extrait un message d'erreur lisible depuis une réponse Axios ──
export function extractErrorMessage(err) {
  if (!err) return 'Erreur inconnue.';

  // Pas de réponse = erreur réseau
  if (!err.response) {
    if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') {
      return 'Serveur inaccessible. Vérifiez votre connexion réseau.';
    }
    if (err.message?.includes('timeout')) {
      return 'Délai d\'attente dépassé. Le serveur met trop de temps à répondre.';
    }
    return 'Impossible de joindre le serveur. Vérifiez votre connexion.';
  }

  const status = err.response.status;
  // Message fourni par le backend (prioritaire)
  const serverMsg =
    err.response.data?.message ||
    err.response.data?.error ||
    err.response.data?.msg;

  if (serverMsg) return serverMsg;

  // Messages par défaut selon le code HTTP
  const defaults = {
    400: 'Données invalides. Vérifiez votre saisie.',
    401: 'Session expirée. Veuillez vous reconnecter.',
    403: 'Accès refusé. Vous n\'avez pas les permissions nécessaires.',
    404: 'Ressource introuvable.',
    408: 'Délai d\'attente dépassé.',
    409: 'Conflit de données. Cet élément existe déjà.',
    413: 'Fichier trop volumineux ou quota dépassé.',
    422: 'Format de données non accepté.',
    429: 'Trop de requêtes. Patientez quelques instants.',
    500: 'Erreur serveur interne. Contactez l\'administrateur.',
    502: 'Serveur temporairement indisponible (502).',
    503: 'Service temporairement indisponible. Réessayez.',
    504: 'Le serveur ne répond pas (timeout 504).',
  };

  return defaults[status] ?? `Erreur ${status}.`;
}

// ─── Intercepteur request : injecte le Bearer token ────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Intercepteur response : refresh token et gestion 401 ──────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('parallax_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(
            `${API_BASE_URL}/api/auth/refresh`,
            null,
            { headers: { Authorization: `Bearer ${refreshToken}` } }
          );
          const newToken = res.data.data.access_token;
          setAccessToken(newToken);
          original.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(original);
        } catch {
          setAccessToken(null);
          localStorage.removeItem('parallax_refresh_token');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } else {
        setAccessToken(null);
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
