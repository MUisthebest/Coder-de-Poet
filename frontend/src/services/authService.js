// services/authService.js
import api from './api';

class AuthService {
  _accessToken = null;

  async login(credentials) {
    try {
      const response = await api.post('/api/auth/signin', credentials);
      const { data } = response;

      console.log("✅ Login response data:", data);

      // Lưu token
      if (data.accessToken) this.setAccessToken(data.accessToken);
      
    // Trả về structure mà frontend mong đợi
      return {success: true, user: data.user}
    
  } catch (error) {
    console.error('❌ Login service error:', error);
    return {
      success: false,
      error: error.response?.data?.errorMessage || error.message
    };
  }
}

  async signup(userData) {
    const response = await api.post('/api/auth/signup', userData);
    const { accessToken } = response.data;
    this.setAccessToken(accessToken);
    return response.data;
  }

async socialLogin(provider, accessToken) {
  try {
    
    const payload = {
      Provider: "google",
      AccessToken: accessToken
    };

    console.log('📤 Sending to backend:', payload);

    const response = await api.post('/api/auth/social-login', payload);
    const { data } = response;

    console.log("✅ Social login response:", data);

    if (data.accessToken) {
      this.setAccessToken(data.accessToken);
    }
    
    return {
      success: true,
      accessToken: data.accessToken,
      user: data.user,
      role: data.user?.role
    };
    
  } catch (error) {
    console.error('❌ Social login service error:', error);
    
    const errorMessage = error.response?.data?.errorMessage 
      || error.response?.data?.message 
      || error.message 
      || 'Social login failed';

    return {
      success: false,
      error: errorMessage
    };
  }
}

  async getCurrentUser() {
    const response = await api.get('/api/auth/me');
    return response.data; 
  }

  getUserRole() {
    const token = this.getStoredToken();
    if (!token) {
      console.log('❌ No token found');
      return null;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('🔍 Full token payload:', payload);
      
      // .NET Core dùng ClaimTypes.Role nên sẽ có key dạng URI
      const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      console.log('👤 User role from token:', role);
      
      return role;
    } catch (error) {
      console.error('❌ Error decoding token:', error);
      return null;
    }
}

  // Refresh token: chỉ gọi API, backend tự đọc cookie
async refreshToken() {
  try {
    const response = await api.post('/api/auth/refresh-token', {});
    const { accessToken } = response.data;
    
    if (!accessToken) {
      throw new Error('No access token in refresh response');
    }
    
    this.setAccessToken(accessToken);
    console.log('✅ Token refreshed successfully');
    return accessToken;
  } catch (error) {
    console.error('❌ Token refresh failed:', error.message || error);
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