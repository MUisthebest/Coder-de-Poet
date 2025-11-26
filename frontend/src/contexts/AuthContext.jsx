import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

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
    const data = await authService.login(credentials);
    const userData = await authService.getCurrentUser();
    setUser(userData);

    return { success: true, role: userData.role };
  };

  const signup = async (userData) => {
    await authService.signup(userData);
    const userDataAfter = await authService.getCurrentUser();
    setUser(userDataAfter);
    return { success: true };
  };

  const socialLogin = async (provider, accessToken) => {
    try {
      const result = await authService.socialLogin(provider, accessToken);
      
      if (result.success) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
        return { 
          success: true, 
          role: userData.role,
          user: userData 
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
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};