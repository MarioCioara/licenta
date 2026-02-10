import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('access_token');

      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          const response = await axios.get('http://localhost:8000/api/auth/me/');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to load user:', error);
          await refreshToken();
        }
      }

      setLoading(false);
    };

    loadUser();
  }, []);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const refreshed = await refreshToken();
          if (refreshed) {
            const token = localStorage.getItem('access_token');
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axios(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const refreshToken = async () => {
    const refresh = localStorage.getItem('refresh_token');

    if (!refresh) {
      logout();
      return false;
    }

    try {
      const response = await axios.post('http://localhost:8000/api/auth/token/refresh/', {
        refresh: refresh
      });

      const { access } = response.data;
      localStorage.setItem('access_token', access);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post('http://localhost:8000/api/auth/login/', {
        username,
        password
      });

      const { access, refresh } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      const userResponse = await axios.get('http://localhost:8000/api/auth/me/');
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
      const response = await axios.post('http://localhost:8000/api/auth/register/', {
        username,
        email,
        password,
        password2
      });

      const { access, refresh, user: userData } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      setUser(userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    const refresh = localStorage.getItem('refresh_token');

    if (refresh) {
      try {
        await axios.post('http://localhost:8000/api/auth/logout/', {
          refresh: refresh
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const toggleFavoriteTeam = async (teamId) => {
    try {
      const response = await axios.post(`http://localhost:8000/api/teams/${teamId}/favorite/`);

      const userResponse = await axios.get('http://localhost:8000/api/auth/me/');
      setUser(userResponse.data);

      return response.data;
    } catch (error) {
      console.error('Failed to toggle favorite team:', error);
      throw error;
    }
  };

  const toggleFavoriteMatch = async (matchId) => {
    try {
      const response = await axios.post(`http://localhost:8000/api/matches/${matchId}/favorite/`);

      const userResponse = await axios.get('http://localhost:8000/api/auth/me/');
      setUser(userResponse.data);

      return response.data;
    } catch (error) {
      console.error('Failed to toggle favorite match:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      await axios.delete('http://localhost:8000/api/auth/delete-account/');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      delete axios.defaults.headers.common['Authorization'];
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
