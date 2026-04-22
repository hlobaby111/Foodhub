import axios from 'axios';
import {
  getAccessToken,
  notifyUnauthorized,
  setAccessToken,
} from '../auth/session';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let pendingRequests = [];

const drainPendingRequests = (error) => {
  pendingRequests.forEach((cb) => cb(error));
  pendingRequests = [];
};

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config || {};
    const isTokenExpired =
      err.response?.status === 401 &&
      (err.response?.data?.code === 'TOKEN_EXPIRED' ||
        err.response?.data?.message === 'Token expired' ||
        err.response?.data?.message === 'Invalid token');

    if (
      isTokenExpired &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh &&
      !originalRequest.url?.includes('/otp-auth/refresh-token') &&
      !originalRequest.url?.includes('/otp-auth/send-otp') &&
      !originalRequest.url?.includes('/otp-auth/verify-otp') &&
      !originalRequest.url?.includes('/otp-auth/logout')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push((refreshErr) => {
            if (refreshErr) {
              reject(refreshErr);
              return;
            }
            resolve(client(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await client.post('/otp-auth/refresh-token', {}, { skipAuthRefresh: true });
        const refreshedToken = refreshRes.data?.accessToken;

        if (!refreshedToken) {
          throw new Error('No access token returned from refresh');
        }

        setAccessToken(refreshedToken);
        drainPendingRequests(null);
        return client(originalRequest);
      } catch (refreshErr) {
        setAccessToken(null);
        drainPendingRequests(refreshErr);
        notifyUnauthorized();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    if (err.response?.status === 401) {
      setAccessToken(null);
      notifyUnauthorized();
    }
    return Promise.reject(err);
  }
);

export default client;
