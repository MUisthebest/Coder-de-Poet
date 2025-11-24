import api from './api';

class AuthService {
  // Login với email/password
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    const { user, accessToken } = response.data;
    
    // Lưu token trong memory (không dùng localStorage)
    this.setAccessToken(accessToken);
    
    return { user, accessToken };
  }

  // Đăng ký user mới
  async signup(userData) {
    const response = await api.post('/auth/signup', userData);
    const { user, accessToken } = response.data;
    
    this.setAccessToken(accessToken);
    return { user, accessToken };
  }

  // Social login
  async socialLogin(provider, method = 'popup') {
    if (method === 'popup') {
      return this.socialLoginPopup(provider);
    } else {
      return this.socialLoginRedirect(provider);
    }
  }

  async socialLoginPopup(provider) {
    // Implement popup logic cho Google/Facebook
    const response = await api.get(`/auth/${provider}`);
    // Xử lý popup và callback
    return response.data;
  }

  // Lấy thông tin user hiện tại
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  }

  // Refresh token
  async refreshToken() {
    const response = await api.post('/auth/refresh');
    const { accessToken } = response.data;
    this.setAccessToken(accessToken);
    return accessToken;
  }

  // Logout
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAccessToken();
    }
  }

  // Token management (in-memory)
  setAccessToken(token) {
    this._accessToken = token;
    // Có thể dùng sessionStorage nếu cần persist qua refresh
    sessionStorage.setItem('accessToken', token);
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