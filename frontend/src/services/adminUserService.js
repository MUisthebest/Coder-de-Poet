// services/adminUserService.js
// Calls auth_service admin user endpoints (baseURL from api.js)
import api from './api';

class AdminUserService {
  async listUsers() {
    try {
      const { data } = await api.get('/api/auth/admin/users');
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.errorMessage || error.message,
        status: error.response?.status,
      };
    }
  }

  async deleteUser(userId) {
    try {
      const { data } = await api.delete(`/api/auth/admin/users/${userId}`);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.errorMessage || error.message,
        status: error.response?.status,
      };
    }
  }
}

export const adminUserService = new AdminUserService();
