import axios from 'axios';
import { API_BASE_URL } from 'src/config/api';
import { getAccessToken, setAccessToken } from 'src/api/authStore';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('parallax_refresh_token');
      if (refreshToken) {
        try {
          // Le backend lit le refresh token dans le header Authorization
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
