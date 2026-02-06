/**
 * Razorpay payment service
 * Handles payment order creation and verification
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');

class PaymentService {
  constructor() {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay configuration missing. Please check environment variables.');
    }

    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    console.log('✅ Razorpay payment service initialized (TEST MODE)');
  }

  /**
   * Create a Razorpay order
   * @param {Object} orderData - Order details
   * @returns {Object} Razorpay order
   */
  async createOrder(orderData) {
    try {
      const { amount, currency = 'INR', userEmail, userName, items } = orderData;

      // Validate amount (Razorpay expects amount in paise)
      const amountInPaise = Math.round(amount * 100);
      
      if (amountInPaise <= 0) {
        throw new Error('Invalid order amount');
      }

      const options = {
        amount: amountInPaise, // Amount in paise
        currency,
        receipt: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        notes: {
          user_email: userEmail,
          user_name: userName,
          item_count: items?.length || 0,
          order_type: 'canteen_token'
        }
      };

      const razorpayOrder = await this.razorpay.orders.create(options);

      console.log(`✅ Razorpay order created: ${razorpayOrder.id} for ₹${amount}`);
      
      return {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        status: razorpayOrder.status,
        created_at: razorpayOrder.created_at
      };
    } catch (error) {
      console.error('❌ Error creating Razorpay order:', error.message);
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Verify Razorpay payment signature
   * @param {Object} paymentData - Payment verification data
   * @returns {boolean} Verification result
   */
  verifyPaymentSignature(paymentData) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new Error('Missing payment verification data');
      }

      // Create the expected signature
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      // Compare signatures
      const isSignatureValid = expectedSignature === razorpay_signature;

      if (isSignatureValid) {
        console.log(`✅ Payment signature verified for order: ${razorpay_order_id}`);
      } else {
        console.error(`❌ Payment signature verification failed for order: ${razorpay_order_id}`);
      }

      return isSignatureValid;
    } catch (error) {
      console.error('❌ Error verifying payment signature:', error.message);
      return false;
    }
  }

  /**
   * Get payment details from Razorpay
   * @param {string} paymentId - Razorpay payment ID
   * @returns {Object} Payment details
   */
  async getPaymentDetails(paymentId) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      
      return {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        order_id: payment.order_id,
        method: payment.method,
        captured: payment.captured,
        created_at: payment.created_at,
        email: payment.email,
        contact: payment.contact
      };
    } catch (error) {
      console.error('❌ Error fetching payment details:', error.message);
      throw new Error('Failed to fetch payment details');
    }
  }

  /**
   * Get order details from Razorpay
   * @param {string} orderId - Razorpay order ID
   * @returns {Object} Order details
   */
  async getOrderDetails(orderId) {
    try {
      const order = await this.razorpay.orders.fetch(orderId);
      
      return {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        created_at: order.created_at,
        notes: order.notes
      };
    } catch (error) {
      console.error('❌ Error fetching order details:', error.message);
      throw new Error('Failed to fetch order details');
    }
  }

  /**
   * Validate payment completion
   * @param {Object} paymentData - Complete payment data
   * @returns {Object} Validation result
   */
  async validatePaymentCompletion(paymentData) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

      // Step 1: Verify signature
      const isSignatureValid = this.verifyPaymentSignature(paymentData);
      if (!isSignatureValid) {
        return {
          success: false,
          error: 'Payment signature verification failed'
        };
      }

      // Step 2: Get payment details from Razorpay
      const paymentDetails = await this.getPaymentDetails(razorpay_payment_id);
      
      // Step 3: Verify payment status
      if (paymentDetails.status !== 'captured') {
        return {
          success: false,
          error: 'Payment not captured successfully'
        };
      }

      // Step 4: Verify order ID matches
      if (paymentDetails.order_id !== razorpay_order_id) {
        return {
          success: false,
          error: 'Payment order ID mismatch'
        };
      }

      console.log(`✅ Payment validation successful for: ${razorpay_payment_id}`);
      
      return {
        success: true,
        paymentDetails: {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          amount: paymentDetails.amount / 100, // Convert paise to rupees
          currency: paymentDetails.currency,
          method: paymentDetails.method,
          status: paymentDetails.status
        }
      };
    } catch (error) {
      console.error('❌ Payment validation failed:', error.message);
      return {
        success: false,
        error: 'Payment validation failed'
      };
    }
  }

  /**
   * Format amount for display (convert paise to rupees)
   * @param {number} amountInPaise - Amount in paise
   * @returns {number} Amount in rupees
   */
  formatAmount(amountInPaise) {
    return amountInPaise / 100;
  }

  /**
   * Check if payment configuration is valid
   * @returns {boolean} Configuration validity
   */
  isConfigurationValid() {
    return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  }
}

// Singleton instance
let paymentService = null;

function getPaymentService() {
  if (!paymentService) {
    paymentService = new PaymentService();
  }
  return paymentService;
}

module.exports = {
  PaymentService,
  getPaymentService
};