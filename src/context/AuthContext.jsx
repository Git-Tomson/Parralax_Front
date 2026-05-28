import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from 'src/api/client';
import { setAccessToken } from 'src/api/authStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const refresh = localStorage.getItem('parallax_refresh_token');
    if (!refresh) {
      setIsLoading(false);
      return;
    }
    // Le token 401 va déclencher l'intercepteur qui rafraîchit automatiquement
    apiClient
      .get('/api/auth/me')
      .then((res) => {
        // /api/auth/me retourne { success, data: { id, username, role, ... } }
        setUser(res.data.data);
      })
      .catch(() => {
        localStorage.removeItem('parallax_refresh_token');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (credentials) => {
    const res = await apiClient.post('/api/auth/login', credentials);
    // Login retourne { success, data: { access_token, refresh_token, user } }
    const { access_token, refresh_token, user: userData } = res.data.data;
    setAccessToken(access_token);
    localStorage.setItem('parallax_refresh_token', refresh_token);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // ignore — token peut déjà être expiré
    }
    setAccessToken(null);
    localStorage.removeItem('parallax_refresh_token');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
