import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token');

    if (refresh) {
      try {
        await api.post('/api/auth/logout/', {
          refresh: refresh
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  const refreshToken = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token');

    if (!refresh) {
      logout();
      return false;
    }

    try {
      const response = await api.post('/api/auth/token/refresh/', {
        refresh: refresh
      });

      const { access } = response.data;
      localStorage.setItem('access_token', access);
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  }, [logout]);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('access_token');

      if (token) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          const response = await api.get('/api/auth/me/');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to load user:', error);
          await refreshToken();
        }
      }

      setLoading(false);
    };

    loadUser();
  }, [refreshToken]);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const refreshed = await refreshToken();
          if (refreshed) {
            const token = localStorage.getItem('access_token');
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [refreshToken]);

  const login = async (username, password) => {
    try {
      const response = await api.post('/api/auth/login/', {
        username,
        password
      });

      const { access, refresh } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      const userResponse = await api.get('/api/auth/me/');
      setUser(userResponse.data);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed'
      };
    }
  };

  const register = async (username, email, password, password2) => {
    try {
      const response = await api.post('/api/auth/register/', {
        username,
        email,
        password,
        password2
      });

      const { access, refresh, user: userData } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      setUser(userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Registration failed'
      };
    }
  };

  const toggleFavoriteTeam = async (teamId) => {
    try {
      const response = await api.post(`/api/teams/${teamId}/favorite/`);

      const userResponse = await api.get('/api/auth/me/');
      setUser(userResponse.data);

      return response.data;
    } catch (error) {
      console.error('Failed to toggle favorite team:', error);
      throw error;
    }
  };

  const toggleFavoriteMatch = async (matchId) => {
    try {
      const response = await api.post(`/api/matches/${matchId}/favorite/`);

      const userResponse = await api.get('/api/auth/me/');
      setUser(userResponse.data);

      return response.data;
    } catch (error) {
      console.error('Failed to toggle favorite match:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      await api.delete('/api/auth/delete-account/');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete account:', error);
      return { success: false, error: error.response?.data?.detail || 'Failed to delete account' };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    deleteAccount,
    toggleFavoriteTeam,
    toggleFavoriteMatch,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
