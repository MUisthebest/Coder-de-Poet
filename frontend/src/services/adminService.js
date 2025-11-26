// services/adminService.js
import api from './api';
import { authService } from './authService';

class AdminService {
  async getAdminDashboard() {
    try {
      console.log('🔄 Fetching admin dashboard...');
      
      const response = await api.get('/api/auth/admin');
      console.log('✅ Admin dashboard data:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Admin dashboard error:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      };
    }
  }

  async getAdminCourses() {
    try {
      console.log('🔄 Fetching admin courses...');
      
      const response = await api.get('/api/auth/admin/courses');
      console.log('✅ Admin courses data:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Admin courses error:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      };
    }
  }

  // Kiểm tra quyền trước khi truy cập
  checkAdminAccess() {
    const role = authService.getUserRole();
    const isAdmin = role === 'Admin';
    const isInstructor = role === 'Instructor';
    
    console.log('🔐 Current user role:', role);
    console.log('👑 Is Admin:', isAdmin);
    console.log('🎓 Is Instructor:', isInstructor);
    
    return {
      isAdmin,
      isInstructor,
      role
    };
  }
}

export const adminService = new AdminService();