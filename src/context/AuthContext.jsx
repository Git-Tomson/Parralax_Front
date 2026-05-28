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
    apiClient
      .get('/api/auth/me')
      .then((res) => {
        setAccessToken(res.data.access_token ?? null);
        setUser(res.data.user ?? res.data);
      })
      .catch(() => {
        localStorage.removeItem('parallax_refresh_token');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (credentials) => {
    const res = await apiClient.post('/api/auth/login', credentials);
    setAccessToken(res.data.access_token);
    localStorage.setItem('parallax_refresh_token', res.data.refresh_token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // ignore
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
