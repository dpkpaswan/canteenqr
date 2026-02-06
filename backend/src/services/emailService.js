/**
 * Professional Email Service for AM Jain College Canteen
 * Sends order confirmation emails after successful payment verification
 */

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter with environment variables
   */
  async initializeTransporter() {
    try {
      // Check for required environment variables
      const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];
      const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
      
      if (missingVars.length > 0) {
        console.log(`⚠️  Missing email configuration: ${missingVars.join(', ')}`);
        console.log('📧 Email service will be disabled');
        return;
      }

      // Create nodemailer transporter
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      // Verify connection
      await this.transporter.verify();
      this.isConfigured = true;
      console.log('✅ Email service initialized and verified');
      
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      console.log('📧 Email notifications will be disabled');
      this.isConfigured = false;
    }
  }

  /**
   * Send order confirmation email after successful payment
   * @param {Object} orderData - Complete order information
   * @param {Object} paymentData - Razorpay payment details
   * @returns {boolean} Success status
   */
  async sendOrderConfirmationEmail(orderData, paymentData) {
    if (!this.isConfigured) {
      console.log('📧 Email service not configured - skipping email notification');
      return false;
    }

    try {
      const {
        user_name,
        user_email,
        token,
        items,
        total_amount,
        created_at,
        id: orderId
      } = orderData;

      const {
        razorpay_payment_id,
        razorpay_order_id
      } = paymentData;

      // Generate email content
      const emailHtml = this.generateOrderConfirmationHTML({
        studentName: user_name,
        tokenNumber: token,
        orderItems: items,
        totalAmount: total_amount,
        paymentId: razorpay_payment_id,
        orderDate: new Date(created_at).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      });

      const emailText = this.generateOrderConfirmationText({
        studentName: user_name,
        tokenNumber: token,
        orderItems: items,
        totalAmount: total_amount,
        paymentId: razorpay_payment_id,
        orderDate: new Date(created_at).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata'
        })
      });

      // Email options
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: user_email,
        subject: 'AM Jain College – Canteen Order Confirmation',
        html: emailHtml,
        text: emailText
      };

      // Send email
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Order confirmation email sent to: ${user_email} (Token: ${token})`);
      return true;

    } catch (error) {
      console.error('❌ Failed to send order confirmation email:', error.message);
      // Important: Don't throw error - just log and return false
      // This ensures order success is not affected by email failures
      return false;
    }
  }

  /**
   * Generate HTML email template
   */
  generateOrderConfirmationHTML(data) {
    const { studentName, tokenNumber, orderItems, totalAmount, paymentId, orderDate } = data;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #2563eb; margin: 0; font-size: 24px; }
            .header h2 { color: #666; margin: 5px 0 0 0; font-size: 16px; font-weight: normal; }
            .token-box { background: #2563eb; color: white; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0; }
            .token-number { font-size: 32px; font-weight: bold; margin: 0; }
            .token-label { font-size: 14px; margin: 5px 0 0 0; opacity: 0.9; }
            .section { margin: 20px 0; }
            .section h3 { color: #2563eb; margin: 0 0 10px 0; font-size: 18px; }
            .order-items { background: #f8f9fa; padding: 15px; border-radius: 6px; }
            .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
            .item:last-child { border-bottom: none; }
            .item-name { font-weight: 500; }
            .item-price { color: #28a745; font-weight: 600; }
            .total { background: #28a745; color: white; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0; }
            .total-amount { font-size: 24px; font-weight: bold; margin: 0; }
            .info-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 10px; margin: 20px 0; }
            .info-label { font-weight: 600; color: #666; }
            .pickup-info { background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #666; font-size: 14px; }
            @media (max-width: 600px) {
                .container { padding: 20px; margin: 10px; }
                .info-grid { grid-template-columns: 1fr; gap: 5px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>AM Jain College</h1>
                <h2>Canteen Order Confirmation</h2>
            </div>

            <p>Dear <strong>${studentName}</strong>,</p>
            <p>Your order has been successfully confirmed! 🎉</p>

            <div class="token-box">
                <p class="token-number">${tokenNumber}</p>
                <p class="token-label">Your Token Number</p>
            </div>

            <div class="section">
                <h3>Order Details</h3>
                <div class="order-items">
                    ${orderItems.map(item => `
                    <div class="item">
                        <div class="item-name">${item.name} × ${item.quantity}</div>
                        <div class="item-price">₹${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                    `).join('')}
                </div>
                
                <div class="total">
                    <p class="total-amount">Total Paid: ₹${totalAmount}</p>
                </div>
            </div>

            <div class="section">
                <h3>Payment Information</h3>
                <div class="info-grid">
                    <span class="info-label">Payment ID:</span>
                    <span>${paymentId}</span>
                    <span class="info-label">Order Date:</span>
                    <span>${orderDate}</span>
                </div>
            </div>

            <div class="pickup-info">
                <h3 style="margin: 0 0 10px 0; color: #856404;">📍 Pickup Instructions</h3>
                <p style="margin: 0;">Please show this token number at the canteen counter when collecting your order. Keep this email for your reference.</p>
                <p style="margin: 5px 0 0 0; font-weight: 600;">Location: ${process.env.PICKUP_LOCATION || 'Main Canteen Counter'}</p>
            </div>

            <div class="footer">
                <p>Thank you for using AM Jain College Canteen Services!</p>
                <p>For any queries, please contact the canteen staff.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate plain text email (fallback)
   */
  generateOrderConfirmationText(data) {
    const { studentName, tokenNumber, orderItems, totalAmount, paymentId, orderDate } = data;
    
    return `
AM JAIN COLLEGE - CANTEEN ORDER CONFIRMATION

Dear ${studentName},

Your order has been successfully confirmed!

TOKEN NUMBER: ${tokenNumber}

ORDER DETAILS:
${orderItems.map(item => `• ${item.name} × ${item.quantity} - ₹${(item.price * item.quantity).toFixed(2)}`).join('\n')}

TOTAL PAID: ₹${totalAmount}

PAYMENT INFORMATION:
Payment ID: ${paymentId}
Order Date: ${orderDate}

PICKUP INSTRUCTIONS:
Please show this token number at the canteen counter when collecting your order.
Location: ${process.env.PICKUP_LOCATION || 'Main Canteen Counter'}

Thank you for using AM Jain College Canteen Services!
For any queries, please contact the canteen staff.
    `;
  }
}

// Export singleton instance
module.exports = new EmailService();