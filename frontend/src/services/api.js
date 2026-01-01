// src/services/api.js
import axios from 'axios';
import { authService } from './authService';

const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || 'http://144.91.74.84',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Gắn token vào mọi request
api.interceptors.request.use(config => {
  const token = authService.getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// === REFRESH TOKEN QUEUE – CHUẨN 2025 ===
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Chỉ xử lý 401 và chưa từng retry
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/api/auth/refresh-token')) {
      
      if (isRefreshing) {
        // Đang refresh → chờ token mới
        return new Promise(resolve => {
          subscribeTokenRefresh(token => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            } else {
              window.location.href = '/login';
              resolve(Promise.reject(error));
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await authService.refreshToken(); // ← gọi refresh, lưu token mới
        const newToken = authService.getStoredToken();

        if (!newToken) {
          throw new Error('No token after refresh');
        }

        // Thông báo cho tất cả request đang chờ
        onRefreshed(newToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError.message);
        isRefreshing = false;
        onRefreshed(null);
        authService.clearAccessToken();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;