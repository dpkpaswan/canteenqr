/**
 * Token routes
 * Handles token lookup and related operations
 */

const express = require('express');
const { getDatabaseService } = require('../services');
const { validate } = require('../middleware/validateRequest');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route POST /api/tokens/find
 * @desc Find order token by email or phone (Enhanced with today validation)
 * @access Public
 */
router.post('/find', validate.findToken, asyncHandler(async (req, res) => {
  const { email, phone } = req.body;
  
  const databaseService = getDatabaseService();
  const order = await databaseService.findOrderByEmailOrPhone(email, phone);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'No active order found for the provided email or phone number',
      data: null,
      timestamp: new Date().toISOString()
    });
  }

  // Check if order is from today using the enhanced validation
  if (!databaseService.isToday(order.created_at)) {
    return res.status(400).json({
      success: false,
      message: 'Token expired. Valid only on order date.',
      data: {
        orderDate: new Date(order.created_at).toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        currentDate: new Date().toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric'
        })
      },
      timestamp: new Date().toISOString()
    });
  }

  // Return order details with token
  const responseData = {
    order: {
      id: order.id,
      token: order.token,
      status: order.status,
      items: order.items,
      totalAmount: order.total_amount,
      createdAt: order.created_at,
      customerName: order.user_name
    }
  };

  res.status(200).json({
    success: true,
    message: 'Order found successfully',
    data: responseData,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/tokens/:token
 * @desc Get order details by token
 * @access Public
 */
router.get('/:token', validate.tokenParam, asyncHandler(async (req, res) => {
  const { token } = req.params;
  
  const databaseService = getDatabaseService();
  const order = await databaseService.getOrderByToken(token);

  if (!order) {
    throw new AppError('Order not found with this token', 404);
  }

  // Return full order details (since token is provided)
  const responseData = {
    order: {
      id: order.id,
      token: order.token,
      status: order.status,
      items: order.items,
      totalAmount: order.total_amount,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      customerName: order.user_name,
      customerEmail: order.user_email,
      phone: order.phone
    }
  };

  res.status(200).json({
    success: true,
    message: 'Order retrieved successfully',
    data: responseData,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/tokens/:token/status
 * @desc Get only status of an order by token
 * @access Public
 */
router.get('/:token/status', validate.tokenParam, asyncHandler(async (req, res) => {
  const { token } = req.params;
  
  const databaseService = getDatabaseService();
  const order = await databaseService.getOrderByToken(token);

  if (!order) {
    throw new AppError('Order not found with this token', 404);
  }

  // Calculate queue position for pending/preparing orders
  let queuePosition = null;
  if (order.status === 'pending' || order.status === 'preparing') {
    const { data: earlierOrders } = await databaseService.supabase
      .from('orders')
      .select('id')
      .in('status', ['pending', 'preparing'])
      .lt('created_at', order.created_at);
    
    queuePosition = (earlierOrders?.length || 0) + 1;
  }

  const responseData = {
    token: order.token,
    status: order.status,
    queuePosition,
    lastUpdated: order.updated_at,
    createdAt: order.created_at
  };

  res.status(200).json({
    success: true,
    message: 'Order status retrieved successfully',
    data: responseData,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/tokens/validate/:token
 * @desc Validate if a token exists and is valid (Enhanced with "Valid Only Today" rule)
 * @access Public
 */
router.get('/validate/:token', validate.tokenParam, asyncHandler(async (req, res) => {
  const { token } = req.params;
  
  const databaseService = getDatabaseService();
  
  try {
    // Use the enhanced validation function
    const validationResult = await databaseService.validateTokenForPickup(token);
    
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        message: validationResult.error,
        data: {
          token,
          isValid: false,
          isActive: false,
          validToday: false,
          error: validationResult.error
        },
        timestamp: new Date().toISOString()
      });
    }

    const order = validationResult.order;
    const isActive = ['pending', 'preparing', 'ready'].includes(order.status);
    
    const responseData = {
      token,
      isValid: true,
      isActive,
      validToday: true,
      status: order.status,
      orderDetails: {
        customerName: order.user_name,
        items: order.items,
        totalAmount: order.total_amount,
        createdAt: order.created_at
      }
    };

    res.status(200).json({
      success: true,
      message: 'Token is valid and can be processed today',
      data: responseData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      data: {
        token,
        isValid: false,
        isActive: false,
        validToday: false,
        error: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * @route GET /api/tokens/search/:searchTerm
 * @desc Search orders by partial token, name, or email (for customer service)
 * @access Public (but should be protected in production)
 */
router.get('/search/:searchTerm', asyncHandler(async (req, res) => {
  const { searchTerm } = req.params;
  const { limit = 10 } = req.query;

  if (!searchTerm || searchTerm.length < 2) {
    throw new AppError('Search term must be at least 2 characters', 400);
  }

  const databaseService = getDatabaseService();
  
  // Search in multiple fields
  const { data: orders, error } = await databaseService.supabase
    .from('orders')
    .select('id, token, status, user_name, user_email, total_amount, created_at')
    .or(`token.ilike.%${searchTerm}%,user_name.ilike.%${searchTerm}%,user_email.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false })
    .limit(parseInt(limit));

  if (error) {
    throw new AppError('Search failed', 500);
  }

  res.status(200).json({
    success: true,
    message: `Found ${orders?.length || 0} matching orders`,
    data: {
      orders: orders || [],
      searchTerm,
      count: orders?.length || 0
    },
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;