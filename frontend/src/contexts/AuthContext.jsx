import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Kiểm tra cả token và user data từ localStorage
      const token = authService.getStoredToken();
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        setAccessToken(token);
      } else if (token) {
        // Nếu có token nhưng không có user data, lấy user data
        const userDataFromService = await authService.getCurrentUser();
        setUser(userDataFromService);
      }
    } catch (error) {
      console.log('Auth check failed:', error);
      // Không logout ngay, để user vẫn có thể sử dụng app
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const { user: userData, accessToken: token } = await authService.login(credentials);
      setUser(userData);
      setAccessToken(token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (userData) => {
    try {
      const { user: newUser, accessToken: token } = await authService.signup(userData);
      setUser(newUser);
      setAccessToken(token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const socialLogin = async (provider, method = 'popup') => {
    try {
      const { user: userData, accessToken: token } = await authService.socialLogin(provider, method);
      setUser(userData);
      setAccessToken(token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  const value = {
    user,
    accessToken,
    login,
    signup,
    socialLogin,
    logout,
    loading,
    isAuthenticated: !!user || !!authService.getStoredToken(),
    hasRole: (role) => user?.roles?.includes(role)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};