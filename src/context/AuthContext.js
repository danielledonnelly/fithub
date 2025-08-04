import React, { createContext, useContext, useState, useEffect } from 'react';

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
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const savedToken = localStorage.getItem('fithub_token');
        const savedRefreshToken = localStorage.getItem('fithub_refresh_token');
        const savedUser = localStorage.getItem('fithub_user');

        if (savedToken && savedUser) {
          setToken(savedToken);
          setRefreshToken(savedRefreshToken);
          setUser(JSON.parse(savedUser));
          // Verify token is still valid
          verifyToken(savedToken);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Clear authentication data
  const clearAuth = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('fithub_token');
    localStorage.removeItem('fithub_refresh_token');
    localStorage.removeItem('fithub_user');
  };

  // Save authentication data
  const saveAuth = (authData) => {
    const { user, token, refreshToken } = authData;
    
    setUser(user);
    setToken(token);
    setRefreshToken(refreshToken);
    
    localStorage.setItem('fithub_token', token);
    localStorage.setItem('fithub_user', JSON.stringify(user));
    
    if (refreshToken) {
      localStorage.setItem('fithub_refresh_token', refreshToken);
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      saveAuth(data);
      return { success: true, user: data.user };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (username, email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      saveAuth(data);
      
      return { success: true, user: data.user };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout endpoint if we have a token
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      clearAuth();
    }
  };

  // Verify token
  const verifyToken = async (tokenToVerify = token) => {
    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
        },
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      
      // Try to refresh token if available
      if (refreshToken) {
        const refreshSuccess = await refreshAuthToken();
        if (!refreshSuccess) {
          clearAuth();
        }
        return refreshSuccess;
      } else {
        clearAuth();
        return false;
      }
    }
  };

  // Refresh token
  const refreshAuthToken = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      setToken(data.token);
      setRefreshToken(data.refreshToken);
      localStorage.setItem('fithub_token', data.token);
      localStorage.setItem('fithub_refresh_token', data.refreshToken);

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuth();
      return false;
    }
  };

  // Get authorization headers
  const getAuthHeaders = () => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!(user && token);
  };

  const value = {
    user,
    token,
    refreshToken,
    loading,
    error,
    login,
    register,
    logout,
    verifyToken,
    refreshAuthToken,
    getAuthHeaders,
    isAuthenticated,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 