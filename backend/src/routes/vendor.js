/**
 * Vendor routes
 * Handles vendor/admin operations for managing orders
 */

const express = require('express');
const { getDatabaseService, getEmailService, checkServiceHealth } = require('../services');
const { validate } = require('../middleware/validateRequest');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Note: In production, these routes should have proper admin authentication
// For now, they're accessible for development purposes

/**
 * @route GET /api/vendor/orders
 * @desc Get all orders for vendor dashboard
 * @access Admin (should be protected)
 */
router.get('/orders', validate.pagination, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;

  const databaseService = getDatabaseService();
  const result = await databaseService.getVendorOrders(
    parseInt(page), 
    parseInt(limit), 
    status
  );

  res.status(200).json({
    success: true,
    message: 'Orders retrieved successfully',
    data: result,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/vendor/orders/:orderId
 * @desc Get specific order details
 * @access Admin
 */
router.get('/orders/:orderId', validate.uuidParam, asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const databaseService = getDatabaseService();
  const order = await databaseService.getOrderById(orderId);

  if (!order) {
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
 * @route PATCH /api/vendor/orders/:orderId/status
 * @desc Update order status
 * @access Admin
 */
router.patch('/orders/:orderId/status', validate.uuidParam, validate.updateStatus, asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const databaseService = getDatabaseService();
  const emailService = getEmailService();

  // Get current order to check if status change is valid
  const currentOrder = await databaseService.getOrderById(orderId);
  if (!currentOrder) {
    throw new AppError('Order not found', 404);
  }

  // Validate status transition
  const validTransitions = {
    pending: ['preparing', 'completed'],
    preparing: ['ready', 'completed'],
    ready: ['completed'],
    completed: [] // Final state
  };

  if (!validTransitions[currentOrder.status]?.includes(status)) {
    throw new AppError(`Cannot change status from ${currentOrder.status} to ${status}`, 400);
  }

  // Update order status
  const updatedOrder = await databaseService.updateOrderStatus(orderId, status);

  // Send notification email for certain status updates
  try {
    if (status === 'ready' || status === 'completed') {
      await emailService.sendStatusUpdateEmail({
        user_email: updatedOrder.user_email,
        user_name: updatedOrder.user_name,
        token: updatedOrder.token,
        status,
        items: updatedOrder.items
      });
    }
  } catch (emailError) {
    console.error('❌ Failed to send status update email:', emailError.message);
    // Don't fail the status update if email fails
  }

  res.status(200).json({
    success: true,
    message: `Order status updated to ${status}`,
    data: { order: updatedOrder },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route POST /api/vendor/scan-qr
 * @desc Verify and complete order using QR code scan
 * @access Admin (Vendor only)
 */
router.post('/scan-qr', asyncHandler(async (req, res) => {
  const { qrData } = req.body;
  
  if (!qrData) {
    throw new AppError('QR data is required', 400);
  }

  const databaseService = getDatabaseService();

  // Parse QR data safely
  const qrInfo = parseQrData(qrData);
  
  // Fetch order from database
  const order = await databaseService.getOrderById(qrInfo.orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Validate order for completion
  const validationResult = validateOrderForCompletion(order, qrInfo.token, databaseService);
  if (!validationResult.valid) {
    throw new AppError(validationResult.error, 400);
  }

  // Complete the order using existing service
  const completedOrder = await databaseService.updateOrderStatus(qrInfo.orderId, 'completed');

  res.status(200).json({
    success: true,
    message: 'Order verified and completed successfully',
    data: {
      token: completedOrder.token,
      customerName: completedOrder.user_name,
      completedAt: completedOrder.updated_at,
      items: completedOrder.items,
      totalAmount: completedOrder.total_amount
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/vendor/dashboard
 * @desc Get vendor dashboard statistics
 * @access Admin
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const databaseService = getDatabaseService();

  // Get today's stats
  const todayStats = await databaseService.getTodayStats();

  // Get active orders count by status
  const { data: activeOrders, error } = await databaseService.supabase
    .from('orders')
    .select('status')
    .in('status', ['pending', 'preparing', 'ready']);

  if (error) {
    throw new AppError('Failed to fetch dashboard data', 500);
  }

  const activeCounts = {
    pending: 0,
    preparing: 0,
    ready: 0
  };

  activeOrders?.forEach(order => {
    activeCounts[order.status] = (activeCounts[order.status] || 0) + 1;
  });

  // Calculate today's revenue
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const { data: todayOrders, error: revenueError } = await databaseService.supabase
    .from('orders')
    .select('total_amount')
    .gte('created_at', `${today}T00:00:00Z`)
    .lt('created_at', `${tomorrow}T00:00:00Z`)
    .neq('status', 'cancelled'); // Exclude cancelled orders

  if (revenueError) {
    console.error('Failed to calculate revenue:', revenueError);
  }

  const todayRevenue = todayOrders?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0;

  res.status(200).json({
    success: true,
    message: 'Dashboard data retrieved successfully',
    data: {
      today: {
        stats: todayStats,
        revenue: todayRevenue,
        averageOrderValue: todayStats.total > 0 ? todayRevenue / todayStats.total : 0
      },
      active: {
        counts: activeCounts,
        total: activeCounts.pending + activeCounts.preparing + activeCounts.ready
      },
      timestamps: {
        lastUpdated: new Date().toISOString(),
        todayStart: `${today}T00:00:00Z`
      }
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/vendor/orders/queue
 * @desc Get orders in queue (pending and preparing)
 * @access Admin
 */
router.get('/orders/queue', asyncHandler(async (req, res) => {
  const databaseService = getDatabaseService();

  const { data: queueOrders, error } = await databaseService.supabase
    .from('orders')
    .select('*')
    .in('status', ['pending', 'preparing'])
    .order('created_at', { ascending: true });

  if (error) {
    throw new AppError('Failed to fetch queue orders', 500);
  }

  // Separate by status
  const pending = queueOrders?.filter(order => order.status === 'pending') || [];
  const preparing = queueOrders?.filter(order => order.status === 'preparing') || [];

  res.status(200).json({
    success: true,
    message: 'Queue orders retrieved successfully',
    data: {
      queue: {
        pending,
        preparing,
        total: queueOrders?.length || 0
      },
      summary: {
        pendingCount: pending.length,
        preparingCount: preparing.length,
        totalInQueue: queueOrders?.length || 0,
        estimatedWaitTime: (queueOrders?.length || 0) * 5 // 5 minutes per order
      }
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/vendor/orders/ready
 * @desc Get orders ready for pickup
 * @access Admin
 */
router.get('/orders/ready', asyncHandler(async (req, res) => {
  const databaseService = getDatabaseService();

  const { data: readyOrders, error } = await databaseService.supabase
    .from('orders')
    .select('*')
    .eq('status', 'ready')
    .order('updated_at', { ascending: true }); // Show oldest ready orders first

  if (error) {
    throw new AppError('Failed to fetch ready orders', 500);
  }

  res.status(200).json({
    success: true,
    message: 'Ready orders retrieved successfully',
    data: {
      orders: readyOrders || [],
      count: readyOrders?.length || 0
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route POST /api/vendor/orders/bulk-update
 * @desc Update multiple orders at once
 * @access Admin
 */
router.post('/orders/bulk-update', asyncHandler(async (req, res) => {
  const { orderIds, newStatus } = req.body;

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    throw new AppError('Order IDs array is required', 400);
  }

  if (!['pending', 'preparing', 'ready', 'completed'].includes(newStatus)) {
    throw new AppError('Invalid status', 400);
  }

  const databaseService = getDatabaseService();
  const results = [];
  const errors = [];

  // Update each order
  for (const orderId of orderIds) {
    try {
      const updatedOrder = await databaseService.updateOrderStatus(orderId, newStatus);
      results.push({
        orderId,
        success: true,
        order: updatedOrder
      });
    } catch (error) {
      errors.push({
        orderId,
        success: false,
        error: error.message
      });
    }
  }

  res.status(200).json({
    success: true,
    message: `Bulk update completed. ${results.length} successful, ${errors.length} failed.`,
    data: {
      successful: results,
      failed: errors,
      summary: {
        total: orderIds.length,
        successful: results.length,
        failed: errors.length
      }
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/vendor/analytics/today
 * @desc Get detailed analytics for today
 * @access Admin
 */
router.get('/analytics/today', asyncHandler(async (req, res) => {
  const databaseService = getDatabaseService();
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Get all today's orders
  const { data: todayOrders, error } = await databaseService.supabase
    .from('orders')
    .select('*')
    .gte('created_at', `${today}T00:00:00Z`)
    .lt('created_at', `${tomorrow}T00:00:00Z`);

  if (error) {
    throw new AppError('Failed to fetch analytics data', 500);
  }

  const orders = todayOrders || [];

  // Calculate analytics
  const analytics = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0),
    averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) / orders.length : 0,
    statusBreakdown: {
      pending: orders.filter(o => o.status === 'pending').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      completed: orders.filter(o => o.status === 'completed').length
    },
    hourlyBreakdown: {},
    topItems: {}
  };

  // Calculate hourly breakdown
  orders.forEach(order => {
    const hour = new Date(order.created_at).getHours();
    analytics.hourlyBreakdown[hour] = (analytics.hourlyBreakdown[hour] || 0) + 1;
  });

  // Calculate top items
  orders.forEach(order => {
    order.items.forEach(item => {
      const key = item.name;
      if (!analytics.topItems[key]) {
        analytics.topItems[key] = {
          name: item.name,
          quantity: 0,
          revenue: 0
        };
      }
      analytics.topItems[key].quantity += item.quantity;
      analytics.topItems[key].revenue += item.quantity * item.price;
    });
  });

  // Convert topItems to sorted array
  analytics.topItems = Object.values(analytics.topItems)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10); // Top 10 items

  res.status(200).json({
    success: true,
    message: 'Today analytics retrieved successfully',
    data: {
      analytics,
      period: {
        date: today,
        start: `${today}T00:00:00Z`,
        end: `${tomorrow}T00:00:00Z`
      }
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/vendor/health
 * @desc Check vendor service health
 * @access Admin
 */
router.get('/health', asyncHandler(async (req, res) => {
  const health = await checkServiceHealth();
  
  res.status(200).json({
    success: true,
    message: 'Vendor service health check',
    data: {
      services: health,
      overall: Object.values(health).every(status => status === true) ? 'healthy' : 'degraded'
    },
    timestamp: new Date().toISOString()
  });
}));

// Helper functions for QR code scanning functionality

/**
 * Helper function to parse QR data safely
 * @param {string} qrData - Raw QR code data
 * @returns {object} Parsed QR data
 */
function parseQrData(qrData) {
  try {
    const parsed = JSON.parse(qrData);
    
    // Validate required fields
    if (!parsed.orderId || !parsed.token || !parsed.date) {
      throw new AppError('Invalid QR data: Missing required fields', 400);
    }

    return {
      orderId: parsed.orderId,
      token: parsed.token,
      date: parsed.date
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Invalid QR data format', 400);
  }
}

/**
 * Validate order for completion via QR scan
 * @param {object} order - Order from database
 * @param {string} token - Token from QR code
 * @param {object} databaseService - Database service instance
 * @returns {object} Validation result
 */
function validateOrderForCompletion(order, token, databaseService) {
  // Check token match
  if (order.token !== token) {
    return { valid: false, error: 'Token mismatch' };
  }

  // Check if order is from today using existing timezone logic
  if (!databaseService.isToday(order.created_at)) {
    return { valid: false, error: 'Token expired. Valid only on order date.' };
  }

  // Check if already completed
  if (order.status === 'completed') {
    return { valid: false, error: 'Token already used' };
  }

  // Check if order is ready for pickup
  if (order.status !== 'ready') {
    return { 
      valid: false, 
      error: `Order not ready for pickup. Current status: ${order.status}` 
    };
  }

  return { valid: true };
}

module.exports = router;