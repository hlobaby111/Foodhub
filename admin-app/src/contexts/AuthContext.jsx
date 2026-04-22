import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import client from '../api/client';
import {
  setAccessToken,
  setCurrentUser,
  setUnauthorizedHandler,
} from '../auth/session';

const ADMIN_ROLES = ['admin', 'finance_admin', 'sub_admin'];
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const hasBootstrapped = useRef(false);

  const clearAuthState = () => {
    setAccessToken(null);
    setCurrentUser(null);
    setUser(null);
  };

  const applyLoginResult = (payload) => {
    const token = payload?.accessToken;
    const nextUser = payload?.user;

    if (!token || !nextUser || !ADMIN_ROLES.includes(nextUser.role)) {
      throw new Error('Access denied - you are not an admin');
    }

    setAccessToken(token);
    setCurrentUser(nextUser);
    setUser(nextUser);
  };

  const logout = async () => {
    try {
      await client.post('/otp-auth/logout', {}, { skipAuthRefresh: true });
    } catch (_) {
      // Always clear local auth state even if API call fails.
    } finally {
      clearAuthState();
    }
  };

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearAuthState();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    if (hasBootstrapped.current) {
      return;
    }
    hasBootstrapped.current = true;

    const bootstrap = async () => {
      try {
        const refreshRes = await client.post('/otp-auth/refresh-token', {}, { skipAuthRefresh: true });
        const refreshedAccessToken = refreshRes.data?.accessToken;
        if (!refreshedAccessToken) {
          throw new Error('No access token in refresh response');
        }

        setAccessToken(refreshedAccessToken);
        const meRes = await client.get('/otp-auth/me', { skipAuthRefresh: true });
        const meUser = meRes.data?.user;

        if (!meUser || !ADMIN_ROLES.includes(meUser.role)) {
          throw new Error('Access denied - you are not an admin');
        }

        setCurrentUser(meUser);
        setUser(meUser);
      } catch (_) {
        clearAuthState();
      } finally {
        setIsReady(true);
      }
    };

    bootstrap();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isReady,
      isAuthenticated: Boolean(user),
      applyLoginResult,
      logout,
    }),
    [user, isReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
