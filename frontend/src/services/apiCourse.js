import axios from "axios";
import { authService } from "./authService";

const apiCourse = axios.create({
  baseURL: process.env.REACT_APP_COURSE_SERVICE_URL || 'http://localhost:3001',
  withCredentials: true,
});

console.log("apiCourse baseURL:", process.env.REACT_APP_COURSE_SERVICE_URL);

// Gắn token từ authService vào mọi request
apiCourse.interceptors.request.use(config => {
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

apiCourse.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Chỉ xử lý 401 và chưa từng retry
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/refresh-token')) {
      
      if (isRefreshing) {
        // Đang refresh → chờ token mới
        return new Promise(resolve => {
          subscribeTokenRefresh(token => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiCourse(originalRequest));
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
        await authService.refreshToken();
        const newToken = authService.getStoredToken();

        if (!newToken) {
          throw new Error('No token after refresh');
        }

        // Thông báo cho tất cả request đang chờ
        onRefreshed(newToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiCourse(originalRequest);
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

export default apiCourse;

