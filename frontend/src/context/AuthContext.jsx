import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Role-based access configuration
  const rolePermissions = {
    admin: ['dashboard', 'hr', 'marketing', 'crm', 'inventory', 'sales', 'logistics', 'users', 'reports', 'profile'],
    marketing: ['dashboard', 'marketing', 'profile'],
    sales: ['dashboard', 'sales', 'profile'],
    logistics: ['dashboard', 'logistics', 'profile'],
    crm: ['dashboard', 'crm', 'profile'],
    inventory: ['dashboard', 'inventory', 'profile'],
    hr: ['dashboard', 'hr', 'users', 'profile']
  };

  useEffect(() => {
    // Check if user is logged in on app load
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const data = response.data;
      
      // Store user data and token
      setUser(data.user);
      setToken(data.token);
      
      // Persist to localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const hasPermission = (page) => {
    if (!user || !user.role) return false;
    const permissions = rolePermissions[user.role];
    return permissions && permissions.includes(page);
  };

  const getAccessibleModules = () => {
    if (!user || !user.role) return [];
    return rolePermissions[user.role] || [];
  };

  const isAuthenticated = () => {
    return !!user && !!token;
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    hasPermission,
    getAccessibleModules,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
