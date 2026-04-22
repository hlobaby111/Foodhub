import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  user: 'user',
};

const normalizeAuthPayload = (payload = {}) => {
  const accessToken = payload.accessToken || payload.token;
  const refreshToken = payload.refreshToken || null;
  return {
    accessToken,
    refreshToken,
    user: payload.user || null,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.user);
    setUser(null);
    setLoading(false);
  }, []);

  const persistSession = useCallback((payload) => {
    const { accessToken, refreshToken, user: userData } = normalizeAuthPayload(payload);

    if (!accessToken || !userData) {
      throw new Error('Invalid auth response: missing access token or user data');
    }

    localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
    } else {
      localStorage.removeItem(STORAGE_KEYS.refreshToken);
    }
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userData));
    setUser(userData);
  }, []);

  // Restore session from localStorage like mobile app.
  const loadUser = useCallback(async () => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEYS.user);
      const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken);

      if (storedUser && accessToken) {
        const response = await api.get('/api/otp-auth/me', { skipAuthRefresh: true });
        const userData = response.data?.user || JSON.parse(storedUser);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userData));
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      // Clear session on auth failure
      console.error('Failed to load user:', error);
      localStorage.removeItem(STORAGE_KEYS.accessToken);
      localStorage.removeItem(STORAGE_KEYS.refreshToken);
      localStorage.removeItem(STORAGE_KEYS.user);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Listen for session expiry events dispatched by the api.js interceptor
  useEffect(() => {
    const handleExpiry = () => clearSession();
    window.addEventListener('auth:sessionExpired', handleExpiry);
    return () => window.removeEventListener('auth:sessionExpired', handleExpiry);
  }, [clearSession]);

  const login = useCallback(async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    persistSession(response.data);
    return response.data;
  }, [persistSession]);

  const register = useCallback(async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    persistSession(response.data);
    return response.data;
  }, [persistSession]);

  const verifyOTPLogin = useCallback(async ({ phone, otp }) => {
    const response = await api.post('/api/otp-auth/verify-otp', { phone, otp });
    persistSession(response.data);
    return response.data;
  }, [persistSession]);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
      await api.post('/api/otp-auth/logout', { refreshToken });
    } catch (error) {
      // Log error but clear local session anyway
      console.error('Logout API error:', error);
    } finally {
      clearSession();
    }
  }, [clearSession]);

  // Memoize context value to prevent unnecessary re-renders
  const value = React.useMemo(
    () => ({ user, loading, login, register, verifyOTPLogin, persistSession, logout, loadUser }),
    [user, loading, login, register, verifyOTPLogin, persistSession, logout, loadUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
