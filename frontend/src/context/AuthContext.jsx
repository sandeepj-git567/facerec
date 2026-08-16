import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiService } from '../services/apiService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in storage
    const storedUser = localStorage.getItem('facesecure_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem('facesecure_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const userData = await apiService.login(username, password);
      localStorage.setItem('facesecure_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      throw error.message || error || 'Login failed. Please verify credentials.';
    }
  };

  const loginWithFace = async (base64Image, optionalDetails = {}) => {
    try {
      const userData = await apiService.loginWithFace(base64Image, optionalDetails);
      localStorage.setItem('facesecure_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      throw error.message || error || 'Face authentication failed. Please retry or sign in with your username.';
    }
  };

  const logout = () => {
    localStorage.removeItem('facesecure_user');
    setUser(null);
  };

  const isAdmin = () => {
    return user?.roles?.includes('ROLE_ADMIN') || false;
  };

  const value = {
    user,
    loading,
    login,
    loginWithFace,
    logout,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
