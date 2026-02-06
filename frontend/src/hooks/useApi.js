/**
 * React hooks for API integration
 * Custom hooks for managing API state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import api, { authAPI, orderAPI, tokenAPI, utilityAPI } from '../services/api';

// Custom hook for API calls with loading states
export const useApiCall = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = useCallback(async (apiFunction, ...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      return result;
    } catch (err) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { apiCall, loading, error };
};

// Authentication hook
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { apiCall, loading: authLoading, error } = useApiCall();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Only check if we have a token
        const token = localStorage.getItem('authToken');
        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        const response = await authAPI.verifyToken();
        if (response.success) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          // Clear invalid token
          localStorage.removeItem('authToken');
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.log('🔐 Authentication check failed:', err.message);
        // Clear potentially invalid token
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (idToken) => {
    const response = await apiCall(authAPI.googleLogin, idToken);
    if (response.success) {
      setUser(response.data.user);
      setIsAuthenticated(true);
    }
    return response;
  }, [apiCall]);

  const logout = useCallback(() => {
    authAPI.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return {
    user,
    isAuthenticated,
    loading: loading || authLoading,
    error,
    login,
    logout,
  };
};

// Orders hook
export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [queueStatus, setQueueStatus] = useState(null);
  const { apiCall, loading, error } = useApiCall();

  const fetchMyOrders = useCallback(async (page = 1, limit = 10, status = null) => {
    const response = await apiCall(orderAPI.getMyOrders, page, limit, status);
    if (response.success) {
      setOrders(response.data.orders);
    }
    return response;
  }, [apiCall]);

  const fetchActiveOrder = useCallback(async () => {
    const response = await apiCall(orderAPI.getActiveOrder);
    if (response.success) {
      setActiveOrder(response.data.order);
    }
    return response;
  }, [apiCall]);

  const fetchQueueStatus = useCallback(async () => {
    const response = await apiCall(orderAPI.getQueueStatus);
    if (response.success) {
      setQueueStatus(response.data);
    }
    return response;
  }, [apiCall]);

  const cancelOrder = useCallback(async (orderId) => {
    const response = await apiCall(orderAPI.cancelOrder, orderId);
    if (response.success) {
      // Refresh orders after cancellation
      await fetchMyOrders();
      await fetchActiveOrder();
    }
    return response;
  }, [apiCall, fetchMyOrders, fetchActiveOrder]);

  return {
    orders,
    activeOrder,
    queueStatus,
    loading,
    error,
    fetchMyOrders,
    fetchActiveOrder,
    fetchQueueStatus,
    cancelOrder,
  };
};

// Payment hook
export const usePayment = () => {
  const [paymentConfig, setPaymentConfig] = useState(null);
  const { apiCall, loading, error } = useApiCall();

  const fetchPaymentConfig = useCallback(async () => {
    const response = await apiCall(api.payment.getConfig);
    if (response.success) {
      setPaymentConfig(response.data);
    }
    return response;
  }, [apiCall]);

  const createPaymentOrder = useCallback(async (orderData) => {
    return await apiCall(api.payment.createOrder, orderData);
  }, [apiCall]);

  const verifyPayment = useCallback(async (paymentData) => {
    return await apiCall(api.payment.verifyPayment, paymentData);
  }, [apiCall]);

  return {
    paymentConfig,
    loading,
    error,
    fetchPaymentConfig,
    createPaymentOrder,
    verifyPayment,
  };
};

// Token lookup hook
export const useTokenLookup = () => {
  const [tokenData, setTokenData] = useState(null);
  const { apiCall, loading, error } = useApiCall();

  const findToken = useCallback(async (searchData) => {
    const response = await apiCall(tokenAPI.findToken, searchData);
    if (response.success) {
      setTokenData(response.data.order);
    }
    return response;
  }, [apiCall]);

  const getTokenStatus = useCallback(async (token) => {
    const response = await apiCall(tokenAPI.getTokenStatus, token);
    if (response.success) {
      setTokenData(response.data);
    }
    return response;
  }, [apiCall]);

  const clearTokenData = useCallback(() => {
    setTokenData(null);
  }, []);

  return {
    tokenData,
    loading,
    error,
    findToken,
    getTokenStatus,
    clearTokenData,
  };
};

// Health monitoring hook
export const useHealth = () => {
  const [healthStatus, setHealthStatus] = useState(null);
  const { apiCall, loading, error } = useApiCall();

  const checkHealth = useCallback(async () => {
    try {
      const response = await utilityAPI.checkHealth();
      setHealthStatus(response);
      return response;
    } catch (err) {
      setHealthStatus({ success: false, message: 'Backend unavailable' });
      throw err;
    }
  }, []);

  const checkServicesHealth = useCallback(async () => {
    const response = await apiCall(utilityAPI.checkServicesHealth);
    return response;
  }, [apiCall]);

  // Check health on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return {
    healthStatus,
    loading,
    error,
    checkHealth,
    checkServicesHealth,
  };
};

// Export all hooks
export default {
  useApiCall,
  useAuth,
  useOrders,
  usePayment,
  useTokenLookup,
  useHealth,
};