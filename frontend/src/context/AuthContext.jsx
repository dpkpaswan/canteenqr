import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  // Debug helper - expose to window for debugging
  useEffect(() => {
    window.debugAuth = () => {
      const token = localStorage.getItem('authToken') || Cookies.get('canteen_auth_token');
      const storedUser = localStorage.getItem('canteen_user') || Cookies.get('canteen_user');
      
      let tokenInfo = null;
      if (token) {
        const payload = parseJwtPayload(token);
        if (payload) {
          const now = Math.floor(Date.now() / 1000);
          tokenInfo = {
            expiresAt: new Date(payload.exp * 1000).toLocaleString(),
            isExpired: payload.exp < now,
            timeLeft: payload.exp - now > 0 ? `${Math.floor((payload.exp - now) / 3600)}h` : 'Expired'
          };
        }
      }
      
      const authInfo = {
        isAuthenticated,
        hasUser: !!user,
        userEmail: user?.email,
        hasToken: !!token,
        tokenPreview: token ? `${token.slice(0, 20)}...` : null,
        tokenInfo,
        hasStoredUser: !!storedUser,
        loading,
        persistentLogin: !!(localStorage.getItem('authToken') || Cookies.get('canteen_auth_token'))
      };
      
      console.log('🔍 Auth Debug Info:', authInfo);
      
      return authInfo;
    };
    
    // Helper to force token refresh
    window.refreshAuth = async () => {
      console.log('🔄 Forcing token refresh...');
      await refreshTokenIfPossible();
    };
  }, [isAuthenticated, user, loading]);

  useEffect(() => {
    // Check for stored auth token in both localStorage and cookies
    let token = localStorage.getItem('authToken');
    let storedUser = localStorage.getItem('canteen_user');
    
    // Fallback to cookies if localStorage is empty
    if (!token) {
      token = Cookies.get('canteen_auth_token');
      storedUser = Cookies.get('canteen_user');
      
      // If found in cookies, migrate to localStorage
      if (token) {
        localStorage.setItem('authToken', token);
        if (storedUser) {
          localStorage.setItem('canteen_user', storedUser);
        }
      }
    } else {
      // Get user data from localStorage
      storedUser = localStorage.getItem('canteen_user');
    }
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
        // Set the token in API instance
        api.setAuthToken(token);
        
        console.log('✅ Restored user session:', userData.email);
        
        // Verify token is still valid after a delay (but don't logout on failure)
        setTimeout(async () => {
          try {
            await verifyToken();
          } catch (error) {
            console.warn('⚠️ Initial token verification failed, but keeping user logged in:', error.message);
          }
        }, 2000); // Longer delay to avoid race conditions
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        clearAuthData();
      }
    } else {
      console.log('🔑 No valid session found');
    }
    setLoading(false);
  }, []);

  const verifyToken = async () => {
    if (isVerifying) {
      console.log('🔄 Token verification already in progress');
      return;
    }

    const currentToken = localStorage.getItem('authToken');
    if (!currentToken) {
      console.warn('🔑 No token to verify');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await api.auth.verifyToken();
      if (response.success) {
        console.log('✅ Token verified successfully');
        // If token is close to expiry, try to refresh it
        const tokenData = parseJwtPayload(currentToken);
        if (tokenData && isTokenNearExpiry(tokenData.exp)) {
          await refreshTokenIfPossible();
        }
      } else {
        console.warn('🔐 Token verification failed:', response.message);
        // Only logout if it's clearly an authentication issue
        if (response.message && response.message.includes('Authentication')) {
          await handleTokenExpiry();
        } else {
          console.warn('⚠️ Token verification failed but keeping user logged in');
        }
      }
    } catch (error) {
      console.error('❌ Token verification error:', error.message);
      // Only logout on explicit authentication errors
      if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('Authentication required')) {
        console.warn('🔐 Confirmed authentication failure, logging out');
        await handleTokenExpiry();
      } else {
        console.warn('⚠️ Token verification failed due to network/other error, keeping user logged in');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Helper function to parse JWT payload
  const parseJwtPayload = (token) => {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  // Check if token is near expiry (within 1 day)
  const isTokenNearExpiry = (exp) => {
    if (!exp) return false;
    const now = Math.floor(Date.now() / 1000);
    const oneDayInSeconds = 24 * 60 * 60;
    return (exp - now) < oneDayInSeconds;
  };

  // Try to refresh token if possible
  const refreshTokenIfPossible = async () => {
    try {
      const response = await api.auth.refreshToken();
      if (response.success && response.data.token) {
        console.log('🔄 Token refreshed successfully');
        const newToken = response.data.token;
        localStorage.setItem('authToken', newToken);
        Cookies.set('canteen_auth_token', newToken, { expires: 30 }); // 30 days
        api.setAuthToken(newToken);
      }
    } catch (error) {
      console.warn('⚠️ Token refresh failed:', error.message);
    }
  };

  // Handle token expiry gracefully
  const handleTokenExpiry = async () => {
    console.warn('🔐 Handling token expiry');
    clearAuthData();
  };

  // Clear authentication data
  const clearAuthData = () => {
    setUser(null);
    setIsAuthenticated(false);
    
    // Clear from both localStorage and cookies
    localStorage.removeItem('authToken');
    localStorage.removeItem('canteen_user');
    
    Cookies.remove('canteen_auth_token');
    Cookies.remove('canteen_user');
    
    // Clear token from API instance
    api.setAuthToken(null);
  };

  const login = async (googleCredential) => {
    try {
      setLoading(true);
      const response = await api.auth.googleLogin(googleCredential);
      
      if (response.success) {
        const { token, user: userData } = response.data;
        
        setUser(userData);
        setIsAuthenticated(true);
        
        // Store token and user data with longer expiration for persistent login
        localStorage.setItem('authToken', token);
        localStorage.setItem('canteen_user', JSON.stringify(userData));
        
        // Store in cookies with 30 days expiration for maximum persistence
        Cookies.set('canteen_auth_token', token, { expires: 30 });
        Cookies.set('canteen_user', JSON.stringify(userData), { expires: 30 });
        
        // Set token in API instance
        api.setAuthToken(token);
        
        console.log('✅ Login successful - session will persist for 30 days:', userData.email);
        
        return { success: true, data: userData };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Login failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint
      await api.auth.logout();
      console.log('💫 User logged out successfully');
    } catch (error) {
      console.error('⚠️ Logout API call failed:', error);
    } finally {
      // Clear local state regardless of API call success
      clearAuthData();
      localStorage.removeItem('order_reference');
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    verifyToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;