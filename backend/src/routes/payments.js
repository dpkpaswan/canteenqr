/**
 * Payment routes
 * Handles Razorpay payment order creation and verification
 */

const express = require('express');
const { getPaymentService, getDatabaseService, getEmailService } = require('../services');
const emailService = require('../services/emailService'); // Professional email service
const { validate } = require('../middleware/validateRequest');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route POST /api/payments/create-order
 * @desc Create a Razorpay order for payment
 * @access Private
 */
router.post('/create-order', authenticateToken, validate.createOrder, asyncHandler(async (req, res) => {
  const { items, phone } = req.body;
  const { email, name } = req.user;

  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (totalAmount <= 0) {
    throw new AppError('Invalid order total amount', 400);
  }

  const paymentService = getPaymentService();

  // Create Razorpay order
  const razorpayOrder = await paymentService.createOrder({
    amount: totalAmount,
    currency: 'INR',
    userEmail: email,
    userName: name,
    items
  });

  res.status(201).json({
    success: true,
    message: 'Payment order created successfully',
    data: {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount / 100, // Convert paise to rupees
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
      key: process.env.RAZORPAY_KEY_ID, // Frontend needs this for payment
      orderDetails: {
        items,
        totalAmount,
        userEmail: email,
        userName: name,
        phone
      }
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route POST /api/payments/verify
 * @desc Verify Razorpay payment and create order
 * @access Private
 */
router.post('/verify', authenticateToken, validate.verifyPayment, asyncHandler(async (req, res) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    orderData 
  } = req.body;
  
  const { email, name } = req.user;
  const { items, phone } = orderData;

  console.log('🔍 Payment verification request received:', {
    razorpay_order_id,
    razorpay_payment_id,
    user: email,
    itemCount: items?.length
  });

  try {
    const paymentService = getPaymentService();
    const databaseService = getDatabaseService();
    const emailService = getEmailService();

    // Step 1: Validate payment with Razorpay
    console.log('📝 Validating payment with Razorpay...');
    const validationResult = await paymentService.validatePaymentCompletion({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!validationResult.success) {
      console.error('❌ Payment validation failed:', validationResult.error);
      throw new AppError(validationResult.error || 'Payment verification failed', 400);
    }

    console.log('✅ Payment validated successfully');

    // Step 2: Calculate total and verify amount matches
    const calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const paidAmount = validationResult.paymentDetails.amount;

    console.log('💰 Amount verification:', { calculatedTotal, paidAmount });

    if (Math.abs(calculatedTotal - paidAmount) > 0.01) { // Allow 1 paisa difference for rounding
      console.error('❌ Payment amount mismatch:', { calculatedTotal, paidAmount });
      throw new AppError('Payment amount mismatch', 400);
    }

    // Step 3: Create order in database
    console.log('💾 Creating order in database...');
    console.log('🔍 Items data structure:', JSON.stringify(items, null, 2));
    const orderDetails = {
      user_name: name,
      user_email: email,
      phone,
      items,
      total_amount: calculatedTotal,
      payment_id: razorpay_payment_id,
      payment_signature: razorpay_signature
    };

    const createdOrder = await databaseService.createOrder(orderDetails);
    console.log('✅ Order created successfully:', createdOrder.token);

    // Step 4: Send professional confirmation email
    console.log('📧 Sending order confirmation email...');
    console.log('📧 Email service type:', typeof emailService);
    console.log('📧 Email service methods:', Object.getOwnPropertyNames(emailService));
    
    try {
      // Use the sendOrderTokenEmail method that exists
      if (typeof emailService.sendOrderTokenEmail === 'function') {
        const emailSent = await emailService.sendOrderTokenEmail(createdOrder);
        
        if (emailSent) {
          console.log('✅ Order confirmation email sent successfully');
        } else {
          console.log('⚠️  Email service not configured or failed silently');
        }
      } else {
        console.log('❌ sendOrderTokenEmail method not found on emailService');
        console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(emailService)));
      }
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      console.error('❌ Email error stack:', emailError.stack);
      // Important: Don't fail the order if email fails
    }

    // Step 5: Return success response
    console.log('✅ Payment verification completed successfully');
    res.status(201).json({
      success: true,
      message: 'Payment verified and order created successfully',
      data: {
        order: {
          id: createdOrder.id,
          token: createdOrder.token,
          status: createdOrder.status,
          totalAmount: createdOrder.total_amount,
          items: createdOrder.items,
          createdAt: createdOrder.created_at
        },
        payment: {
          id: validationResult.paymentDetails.paymentId,
          amount: validationResult.paymentDetails.amount,
          method: validationResult.paymentDetails.method,
          status: validationResult.paymentDetails.status
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Payment verification failed with error:', {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
    
    // Re-throw to be handled by error middleware
    throw error;
  }
}));

/**
 * @route GET /api/payments/order-status/:orderId
 * @desc Check Razorpay order status
 * @access Private
 */
router.get('/order-status/:orderId', authenticateToken, asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const paymentService = getPaymentService();

  const orderDetails = await paymentService.getOrderDetails(orderId);

  res.status(200).json({
    success: true,
    message: 'Order status retrieved successfully',
    data: {
      orderId: orderDetails.id,
      amount: orderDetails.amount / 100,
      currency: orderDetails.currency,
      status: orderDetails.status,
      receipt: orderDetails.receipt,
      createdAt: new Date(orderDetails.created_at * 1000).toISOString(),
      notes: orderDetails.notes
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/payments/payment-details/:paymentId
 * @desc Get Razorpay payment details
 * @access Private
 */
router.get('/payment-details/:paymentId', authenticateToken, asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const paymentService = getPaymentService();

  const paymentDetails = await paymentService.getPaymentDetails(paymentId);

  res.status(200).json({
    success: true,
    message: 'Payment details retrieved successfully',
    data: {
      paymentId: paymentDetails.id,
      amount: paymentDetails.amount / 100,
      currency: paymentDetails.currency,
      status: paymentDetails.status,
      orderId: paymentDetails.order_id,
      method: paymentDetails.method,
      captured: paymentDetails.captured,
      createdAt: new Date(paymentDetails.created_at * 1000).toISOString(),
      email: paymentDetails.email,
      contact: paymentDetails.contact
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/payments/config
 * @desc Get payment configuration for frontend
 * @access Public
 */
router.get('/config', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Payment configuration retrieved',
    data: {
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      currency: 'INR',
      testMode: true, // Always true for this implementation
      supportedMethods: ['card', 'netbanking', 'wallet', 'upi']
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route POST /api/payments/init-db
 * @desc Initialize database tables
 * @access Public (should be protected in production)
 */
router.post('/init-db', asyncHandler(async (req, res) => {
  try {
    const databaseService = getDatabaseService();
    await databaseService.initializeTables();
    
    res.status(200).json({
      success: true,
      message: 'Database initialized successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      instructions: 'Please run the SQL from backend/database/create_tables.sql in your Supabase SQL editor',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * @route GET /api/payments/health
 * @desc Check payment services health
 * @access Public  
 */
router.get('/health', asyncHandler(async (req, res) => {
  const healthStatus = {
    database: false,
    razorpay: false,
    email: false,
    errors: []
  };

  try {
    // Test database connection
    const databaseService = getDatabaseService();
    await databaseService.supabase.from('orders').select('count').limit(1);
    healthStatus.database = true;
  } catch (dbError) {
    console.error('Database health check failed:', dbError.message);
    healthStatus.errors.push(`Database: ${dbError.message}`);
  }

  try {
    // Test Razorpay connection
    const paymentService = getPaymentService();
    // Just check if service is initialized
    if (paymentService.razorpay) {
      healthStatus.razorpay = true;
    }
  } catch (razorpayError) {
    console.error('Razorpay health check failed:', razorpayError.message);
    healthStatus.errors.push(`Razorpay: ${razorpayError.message}`);
  }

  try {
    // Test email service
    const emailService = getEmailService();
    if (emailService.isConfigured) {
      healthStatus.email = true;
    }
  } catch (emailError) {
    console.error('Email health check failed:', emailError.message);
    healthStatus.errors.push(`Email: ${emailError.message}`);
  }

  res.status(200).json({
    success: true,
    message: 'Payment services health check',
    data: {
      services: healthStatus,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }
  });
}));

module.exports = router;