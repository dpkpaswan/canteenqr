/**
 * API Service for College Canteen QR Backend
 * Centralized API calls and configuration
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const HEALTH_URL = import.meta.env.VITE_API_HEALTH_URL || 'http://localhost:3001/health';

// API Configuration
const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

// Token management
const getAuthToken = () => {
  // Try localStorage first (new system), then cookies (legacy)
  return localStorage.getItem('authToken') || 
         (typeof document !== 'undefined' && document.cookie
           .split('; ')
           .find(row => row.startsWith('canteen_auth_token='))
           ?.split('=')[1]);
};

const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Generic API call function with auto-retry on token expiry
const apiCall = async (endpoint, options = {}, isRetry = false) => {
  try {
    const url = `${apiConfig.baseURL}${endpoint}`;
    const config = {
      method: 'GET',
      headers: {
        ...apiConfig.headers,
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    // Handle non-JSON responses
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      // Handle 401 unauthorized - try token refresh once
      if (response.status === 401 && !isRetry && endpoint !== '/auth/refresh' && endpoint !== '/auth/google-login') {
        console.warn('🔄 Token expired, attempting refresh...');
        try {
          await authAPI.refreshToken();
          // Retry the original request with new token
          return apiCall(endpoint, options, true);
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError.message);
          setAuthToken(null);
          window.location.reload(); // Force page reload to trigger login
        }
      }
      
      // Handle other 401s by clearing token
      if (response.status === 401) {
        setAuthToken(null);
        console.warn('🔐 Authentication token expired or invalid');
      }
      
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`❌ API call failed [${options.method || 'GET'} ${endpoint}]:`, error.message);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  // Google OAuth login
  googleLogin: async (idToken) => {
    const response = await apiCall('/auth/google-login', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    
    if (response.success && response.data.token) {
      setAuthToken(response.data.token);
    }
    
    return response;
  },

  // Verify current token
  verifyToken: async () => {
    return await apiCall('/auth/verify-token', {
      method: 'POST',
    });
  },

  // Get user profile
  getProfile: async () => {
    return await apiCall('/auth/profile');
  },

  // Logout
  logout: () => {
    setAuthToken(null);
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await apiCall('/auth/refresh', {
        method: 'POST',
      });
      
      if (response.success && response.data.token) {
        setAuthToken(response.data.token);
      }
      
      return response;
    } catch (error) {
      // If refresh fails, the token is likely invalid
      setAuthToken(null);
      throw error;
    }
  },
};

// Payment API
export const paymentAPI = {
  // Get payment configuration
  getConfig: async () => {
    return await apiCall('/payments/config');
  },

  // Create payment order
  createOrder: async (orderData) => {
    return await apiCall('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Verify payment
  verifyPayment: async (paymentData) => {
    return await apiCall('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  // Get order status
  getOrderStatus: async (orderId) => {
    return await apiCall(`/payments/order-status/${orderId}`);
  },

  // Get payment details
  getPaymentDetails: async (paymentId) => {
    return await apiCall(`/payments/payment-details/${paymentId}`);
  },
};

// Orders API
export const orderAPI = {
  // Get user's orders
  getMyOrders: async (page = 1, limit = 10, status = null) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    return await apiCall(`/orders/my-orders?${params}`);
  },

  // Get specific order
  getOrder: async (orderId) => {
    return await apiCall(`/orders/my-orders/${orderId}`);
  },

  // Get order by token
  getOrderByToken: async (token) => {
    return await apiCall(`/orders/by-token/${token}`);
  },

  // Get active order
  getActiveOrder: async () => {
    return await apiCall('/orders/active-order');
  },

  // Get queue status
  getQueueStatus: async () => {
    return await apiCall('/orders/queue-status');
  },

  // Cancel order
  cancelOrder: async (orderId) => {
    return await apiCall(`/orders/cancel/${orderId}`, {
      method: 'POST',
    });
  },
};

// Token API
export const tokenAPI = {
  // Find token by email or phone
  findToken: async (searchData) => {
    return await apiCall('/tokens/find', {
      method: 'POST',
      body: JSON.stringify(searchData),
    });
  },

  // Get token details
  getTokenDetails: async (token) => {
    return await apiCall(`/tokens/${token}`);
  },

  // Get token status
  getTokenStatus: async (token) => {
    return await apiCall(`/tokens/${token}/status`);
  },

  // Validate token
  validateToken: async (token) => {
    return await apiCall(`/tokens/validate/${token}`);
  },

  // Search tokens
  searchTokens: async (searchTerm, limit = 10) => {
    const params = new URLSearchParams({ limit });
    return await apiCall(`/tokens/search/${searchTerm}?${params}`);
  },
};

// Vendor API for staff operations
export const vendorAPI = {
  // Scan QR code and verify order
  scanQR: async (qrData) => {
    return await apiCall('/vendor/scan-qr', {
      method: 'POST',
      body: JSON.stringify({ qrData }),
    });
  },

  // Get all orders for staff dashboard
  getOrders: async (page = 1, limit = 20, status = null) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    return await apiCall(`/vendor/orders?${params}`);
  },

  // Get specific order details
  getOrder: async (orderId) => {
    return await apiCall(`/vendor/orders/${orderId}`);
  },

  // Update order status
  updateOrderStatus: async (orderId, status) => {
    return await apiCall(`/vendor/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Get vendor dashboard stats
  getDashboard: async () => {
    return await apiCall('/vendor/dashboard');
  },
};

// Health and utility API
export const utilityAPI = {
  // Check API health
  checkHealth: async () => {
    try {
      const response = await fetch(HEALTH_URL);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  // Check auth health
  checkAuthHealth: async () => {
    return await apiCall('/auth/health');
  },

  // Check services health
  checkServicesHealth: async () => {
    return await apiCall('/vendor/health');
  },
};

// Export token management functions
export { getAuthToken, setAuthToken, getAuthHeaders };

// Export API base URL for external use
export { API_BASE_URL };

// Default export with all APIs
export default {
  auth: authAPI,
  payment: paymentAPI,
  orders: orderAPI,
  tokens: tokenAPI,
  vendor: vendorAPI,
  utility: utilityAPI,
  setAuthToken,
  getAuthToken,
  getAuthHeaders
};