// services/authService.js
import api from './api';

class AuthService {
  _accessToken = null;

  async login(credentials) {
    try {
      const response = await api.post('/api/auth/signin', credentials);
      const { data } = response;

      // Lưu token
      this.setAccessToken(data.accessToken);
      
    // Trả về structure mà frontend mong đợi
      return response.data;
    
  } catch (error) {
    console.error('❌ Login service error:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
}

  async signup(userData) {
    const response = await api.post('/api/auth/signup', userData);
    const { accessToken } = response.data;
    this.setAccessToken(accessToken);
    return response.data;
  }

  async getCurrentUser() {
    const response = await api.get('/api/auth/me');
    return response.data; // { fullName, email, avatarUrl, ... }
  }

  // Refresh token: chỉ gọi API, backend tự đọc cookie
async refreshToken() {
  try {
    const response = await api.post('/api/auth/refresh-token'); // không gửi body
    const { accessToken } = response.data;
    this.setAccessToken(accessToken);
    console.log('Token refreshed successfully');
    return accessToken;
  } catch (error) {
    this.clearAccessToken();
    throw error; // để interceptor bắt
  }
}

  async logout() {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      this.clearAccessToken();
      window.location.href = '/login';
    }
  }

  // Token management
  setAccessToken(token) {
    this._accessToken = token;
    if (token) sessionStorage.setItem('accessToken', token);
  }

  getStoredToken() {
    return this._accessToken || sessionStorage.getItem('accessToken');
  }

  clearAccessToken() {
    this._accessToken = null;
    sessionStorage.removeItem('accessToken');
  }
}

export const authService = new AuthService();