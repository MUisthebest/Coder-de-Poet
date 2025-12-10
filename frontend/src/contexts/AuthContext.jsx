import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import instructorService from '../services/instructorService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.isAdmin === true || user?.role === 'Admin';
  const [canManageCourse, setCanManageCourse] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(false);

  // Khởi động: kiểm tra token → gọi /me → giữ đăng nhập
  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch current user:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const result = await authService.login(credentials);
      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Đăng nhập OK → lấy user
      const userData = await authService.getCurrentUser();
      setUser(userData);

      return { success: true, role: userData.role };
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      return { success: false, error: err.message || "Login failed" };
    }
  };

  const signup = async (userData) => {
    await authService.signup(userData);
    const userDataAfter = await authService.getCurrentUser();
    setUser(userDataAfter);
    return { success: true };
  };

  const socialLogin = async (provider, socialData) => {
    try {
      // socialData can be either a string (legacy token) or an object with token, email, fullName, avatarUrl
      const result = await authService.socialLogin(provider, socialData);
      
      if (result.success) {
        // User is already set from API response in authService
        setUser(result.user);
        return { 
          success: true, 
          role: result.user?.role,
          user: result.user 
        };
      } else {
        return result;
      }
    } catch (error) {
      console.error('Social login error:', error);
      return { 
        success: false, 
        error: 'Social login failed. Please try again.' 
      };
    }
  };

  const checkCourseOwnership = async (courseData, id) => {
    setCheckingPermission(true);

    try {
      const data = await instructorService.checkCourseOwnership(courseData, id);
      console.log(data);

      setCanManageCourse(data?.isAccess || false);
    } catch (error) {
      setCanManageCourse(false);
    } finally {
      setCheckingPermission(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    signup,
    logout,
    socialLogin,
    loading,
    isAdmin,
    isAuthenticated: !!user,
    checkCourseOwnership,
    checkingPermission,
    canManageCourse
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};