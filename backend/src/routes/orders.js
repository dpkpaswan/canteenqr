/**
 * Order routes
 * Handles order-related operations for customers
 */

const express = require('express');
const { getDatabaseService } = require('../services');
const { validate } = require('../middleware/validateRequest');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/orders/my-orders
 * @desc Get current user's orders
 * @access Private
 */
router.get('/my-orders', authenticateToken, validate.pagination, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const { email } = req.user;

  const databaseService = getDatabaseService();

  // Build query for user's orders
  let query = databaseService.supabase
    .from('orders')
    .select('*')
    .eq('user_email', email)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data: orders, error, count } = await query;

  if (error) {
    throw new AppError('Failed to fetch orders', 500);
  }

  res.status(200).json({
    success: true,
    message: 'Orders retrieved successfully',
    data: {
      orders: orders || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: (page * limit) < (count || 0),
        hasPrev: page > 1
      }
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/orders/my-orders/:orderId
 * @desc Get specific order details for current user
 * @access Private
 */
router.get('/my-orders/:orderId', authenticateToken, validate.uuidParam, asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { email } = req.user;

  const databaseService = getDatabaseService();
  
  const { data: order, error } = await databaseService.supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_email', email)
    .single();

  if (error || !order) {
    throw new AppError('Order not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Order details retrieved successfully',
    data: { order },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/orders/by-token/:token
 * @desc Get order details by token (public for QR code scanning)
 * @access Public
 */
router.get('/by-token/:token', validate.tokenParam, asyncHandler(async (req, res) => {
  const { token } = req.params;
  const databaseService = getDatabaseService();

  const order = await databaseService.getOrderByToken(token);

  if (!order) {
    throw new AppError('Order not found with this token', 404);
  }

  // Return limited information for public access
  const publicOrderInfo = {
    id: order.id,
    token: order.token,
    status: order.status,
    items: order.items,
    totalAmount: order.total_amount,
    createdAt: order.created_at,
    // Don't expose personal information in public endpoint
    customerName: order.user_name.split(' ')[0] + '***' // Only first name with masking
  };

  res.status(200).json({
    success: true,
    message: 'Order found',
    data: { order: publicOrderInfo },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/orders/active-order
 * @desc Get user's latest active order
 * @access Private
 */
router.get('/active-order', authenticateToken, asyncHandler(async (req, res) => {
  const { email } = req.user;
  const databaseService = getDatabaseService();

  const { data: orders, error } = await databaseService.supabase
    .from('orders')
    .select('*')
    .eq('user_email', email)
    .in('status', ['pending', 'preparing', 'ready'])
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    throw new AppError('Failed to fetch active order', 500);
  }

  const activeOrder = orders && orders.length > 0 ? orders[0] : null;

  res.status(200).json({
    success: true,
    message: activeOrder ? 'Active order found' : 'No active order found',
    data: { 
      order: activeOrder,
      hasActiveOrder: !!activeOrder 
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/orders/today-stats
 * @desc Get today's order statistics
 * @access Public
 */
router.get('/today-stats', asyncHandler(async (req, res) => {
  const databaseService = getDatabaseService();
  const stats = await databaseService.getTodayStats();

  res.status(200).json({
    success: true,
    message: 'Today statistics retrieved successfully',
    data: { stats },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/orders/queue-status
 * @desc Get current queue status and estimated wait time
 * @access Public
 */
router.get('/queue-status', asyncHandler(async (req, res) => {
  const databaseService = getDatabaseService();

  // Get pending and preparing orders
  const { data: pendingOrders, error: pendingError } = await databaseService.supabase
    .from('orders')
    .select('token, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  const { data: preparingOrders, error: preparingError } = await databaseService.supabase
    .from('orders')
    .select('token, created_at')
    .eq('status', 'preparing')
    .order('created_at', { ascending: true });

  if (pendingError || preparingError) {
    throw new AppError('Failed to fetch queue status', 500);
  }

  // Calculate estimated wait time (5 minutes per order in queue)
  const queueLength = (pendingOrders?.length || 0) + (preparingOrders?.length || 0);
  const estimatedWaitMinutes = queueLength * 5; // 5 minutes per order

  res.status(200).json({
    success: true,
    message: 'Queue status retrieved successfully',
    data: {
      queue: {
        pending: pendingOrders?.length || 0,
        preparing: preparingOrders?.length || 0,
        total: queueLength
      },
      estimatedWait: {
        minutes: estimatedWaitMinutes,
        display: estimatedWaitMinutes > 60 
          ? `${Math.floor(estimatedWaitMinutes / 60)}h ${estimatedWaitMinutes % 60}m`
          : `${estimatedWaitMinutes}m`
      },
      currentTokensInQueue: [
        ...(pendingOrders || []).map(o => ({ token: o.token, status: 'pending' })),
        ...(preparingOrders || []).map(o => ({ token: o.token, status: 'preparing' }))
      ]
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route POST /api/orders/cancel/:orderId
 * @desc Cancel an order (only if pending)
 * @access Private
 */
router.post('/cancel/:orderId', authenticateToken, validate.uuidParam, asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { email } = req.user;

  const databaseService = getDatabaseService();

  // Get order and verify ownership
  const order = await databaseService.getOrderById(orderId);
  
  if (!order || order.user_email !== email) {
    throw new AppError('Order not found', 404);
  }

  if (order.status !== 'pending') {
    throw new AppError('Only pending orders can be cancelled', 400);
  }

  // Update status to completed (cancelled)
  const { data: updatedOrder, error } = await databaseService.supabase
    .from('orders')
    .update({ 
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to cancel order', 500);
  }

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    data: { order: updatedOrder },
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;