import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Wrap loadUser in useCallback to stabilize reference
  const loadUser = useCallback(async () => {
    try {
      // No token needed - handled by httpOnly cookie
      const response = await api.get('/api/auth/profile');
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to load user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed as it only uses stable functions

  useEffect(() => {
    // Always try to load user on mount (cookie-based)
    loadUser();
  }, [loadUser]); // Fixed: Added loadUser dependency

  const login = useCallback(async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    const { user: userData } = response.data;
    // Token is set as httpOnly cookie by backend
    setUser(userData);
    return response.data;
  }, [setUser]); // Fixed: Added setUser dependency

  const register = useCallback(async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    const { user: newUser } = response.data;
    // Token is set as httpOnly cookie by backend
    setUser(newUser);
    return response.data;
  }, [setUser]); // Fixed: Added setUser dependency

  const logout = useCallback(async () => {
    try {
      // Call backend to clear httpOnly cookie
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  }, [setUser]); // Fixed: Added setUser dependency

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loadUser }}>
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