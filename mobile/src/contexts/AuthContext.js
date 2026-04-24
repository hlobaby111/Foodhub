import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext({});

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

  useEffect(() => {
    loadUser();
  }, []);

  const persistSession = async (payload) => {
    const { accessToken, refreshToken, user: userData } = normalizeAuthPayload(payload);

    if (!accessToken || !userData) {
      throw new Error('Invalid auth response: missing access token or user data');
    }

    await AsyncStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      await AsyncStorage.setItem('refreshToken', refreshToken);
    } else {
      await AsyncStorage.removeItem('refreshToken');
    }
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    // Cleanup legacy key after migration.
    await AsyncStorage.removeItem('token');
    setUser(userData);
  };

  const loadUser = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const legacyToken = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');

      if ((accessToken || legacyToken) && userData) {
        if (!accessToken && legacyToken) {
          // Migrate old storage format to the new session contract.
          await AsyncStorage.setItem('accessToken', legacyToken);
          await AsyncStorage.removeItem('token');
        }
        const parsed = JSON.parse(userData);
        setUser(parsed);
        // Restore last location label from backend user profile if not already cached locally
        if (parsed.lastLocationLabel) {
          const cached = await AsyncStorage.getItem('userLastLocation');
          if (!cached) {
            await AsyncStorage.setItem('userLastLocation', parsed.lastLocationLabel);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      await persistSession(response.data);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (name, email, password, phone) => {
    try {
      const response = await api.post('/api/auth/register', {
        name,
        email,
        password,
        phone,
        role: 'customer',
      });
      await persistSession(response.data);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      // Send refresh token so only this device is logged out
      await api.post('/api/otp-auth/logout', { refreshToken });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setUser(null);
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await api.put('/api/auth/profile', data);
      const updatedUser = response.data.user;
      
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Update failed',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        persistSession,
        logout,
        updateProfile,
        isAuthenticated: !!user,
      }}
    >
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
