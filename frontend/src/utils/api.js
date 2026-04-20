import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach access token from localStorage for web OTP flow.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: refresh expired access token once, then retry.
let isRefreshing = false;
let pendingRequests = [];

const drainPendingRequests = (error) => {
  pendingRequests.forEach((cb) => cb(error));
  pendingRequests = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const isTokenExpired =
      error.response?.status === 401 &&
      (error.response?.data?.code === 'TOKEN_EXPIRED' ||
        error.response?.data?.message === 'Token expired');

    if (
      isTokenExpired &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh &&
      // Don't retry refresh endpoint itself.
      !originalRequest.url?.includes('/api/otp-auth/refresh-token') &&
      !originalRequest.url?.includes('/login') &&
      !originalRequest.url?.includes('/register') &&
      !originalRequest.url?.includes('/send-otp') &&
      !originalRequest.url?.includes('/verify-otp')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push((err) =>
            err ? reject(err) : resolve(api(originalRequest))
          );
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshResponse = await axios.post(`${API_URL}/api/otp-auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;

        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

        drainPendingRequests(null);
        return api(originalRequest);
      } catch (refreshError) {
        drainPendingRequests(refreshError);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:sessionExpired'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
