/**
 * Email notification service
 * Handles sending order confirmations and token notifications
 */

const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  async initializeTransporter() {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('⚠️  Email configuration missing. Running in DEVELOPMENT MODE - emails will be logged to console.');
        this.isConfigured = 'development'; // Development mode
        return;
      }

      // Create transporter
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS // Use app password for Gmail
        }
      });

      // Verify configuration
      await this.transporter.verify();
      this.isConfigured = true;
      console.log('✅ Email service initialized and verified');
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      console.log('⚠️  Running in DEVELOPMENT MODE - emails will be logged to console');
      this.isConfigured = 'development';
    }
  }

  /**
   * Send order token email to customer
   * @param {Object} orderData - Order details
   * @returns {boolean} Success status
   */
  async sendOrderTokenEmail(orderData) {
    if (!this.isConfigured) {
      console.log('⚠️  Email service not configured. Skipping email notification.');
      return false;
    }

    // Development mode - log email instead of sending
    if (this.isConfigured === 'development') {
      return this.logOrderTokenEmail(orderData);
    }

    try {
      const { user_email, user_name, token, items, total_amount, id, created_at } = orderData;
      console.log('📧 Email service received items:', JSON.stringify(items, null, 2));

      // Format order time in India timezone
      const orderTime = new Date(created_at).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      // Generate QR code data
      const qrData = {
        orderId: id,
        token: token,
        date: new Date().toISOString().split('T')[0],
        customerName: user_name
      };

      // Generate QR code as base64 data URL with Gmail-compatible options
      let qrCodeDataUrl = null;
      let qrCodeBuffer = null;
      try {
        // First generate as buffer
        qrCodeBuffer = await QRCode.toBuffer(JSON.stringify(qrData), {
          width: 200,
          margin: 4,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
        
        // Convert buffer to base64 data URL
        qrCodeDataUrl = `data:image/png;base64,${qrCodeBuffer.toString('base64')}`;
        
        console.log('✅ QR code generated successfully for email');
        console.log('📊 QR Buffer size:', qrCodeBuffer.length, 'bytes');
        console.log('📊 QR Data URL length:', qrCodeDataUrl.length, 'characters');
      } catch (qrError) {
        console.error('❌ Failed to generate QR code:', qrError.message);
        // Continue without QR - email will still send with token
      }

      const emailTemplate = this.generateOrderTokenEmail({
        userName: user_name,
        token,
        items,
        totalAmount: total_amount,
        orderId: id,
        orderTime: orderTime,
        qrCodeDataUrl: qrCodeDataUrl,
        hasQrAttachment: !!qrCodeBuffer
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM || `"${process.env.CANTEEN_NAME || 'College Canteen'}" <${process.env.EMAIL_USER}>`,
        to: user_email,
        subject: `Your Token is Ready - ${token}`,
        html: emailTemplate,
        text: this.generateOrderTokenText({
          userName: user_name,
          token,
          items,
          totalAmount: total_amount
        }),
        // Attach QR code as inline attachment for Gmail compatibility
        attachments: qrCodeBuffer ? [{
          filename: 'order-qr.png',
          content: qrCodeBuffer,
          cid: 'orderqr', // Content ID for inline embedding
          contentType: 'image/png',
          contentDisposition: 'inline'
        }] : []
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Order token email sent to: ${user_email} (Token: ${token})`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send order token email:', error.message);
      return false;
    }
  }

  /**
   * Log order token email (development mode)
   * @param {Object} orderData - Order details
   * @returns {boolean} Success status
   */
  async logOrderTokenEmail(orderData) {
    try {
      const { user_email, user_name, token, items, total_amount, id } = orderData;
      
      console.log('\n📧 [MOCK EMAIL] Order Confirmation:');
      console.log('========================================');
      console.log(`To: ${user_email}`);
      console.log(`Subject: Your Token is Ready - ${token}`);
      console.log(`\nHello ${user_name},`);
      console.log(`\nYour order has been confirmed! 🎉`);
      console.log(`Order Token: ${token}`);
      console.log(`Order ID: ${id}`);
      console.log(`Total Amount: ₹${total_amount}`);
      
      // Generate QR code data for development logging
      const qrData = {
        orderId: id,
        token: token,
        date: new Date().toISOString().split('T')[0],
        customerName: user_name
      };
      
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));
        console.log(`✅ QR Code Generated: ${qrCodeDataUrl.substring(0, 50)}...`);
      } catch (qrError) {
        console.log(`❌ QR Generation Failed: ${qrError.message}`);
      }
      
      console.log(`QR Code Data: ${JSON.stringify(qrData)}`);
      
      console.log(`\nItems ordered:`);
      items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.name} (Qty: ${item.quantity}) - ₹${item.price * item.quantity}`);
      });
      console.log(`\nPlease show this token when picking up your order.`);
      console.log(`Pickup Location: ${process.env.PICKUP_LOCATION || 'Main Counter'}`);
      console.log('========================================\n');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to log mock email:', error.message);
      return false;
    }
  }

  /**
   * Generate HTML email template for order token
   */
  generateOrderTokenEmail({ userName, token, items, totalAmount, orderId, orderTime, qrCodeDataUrl, hasQrAttachment }) {
    const collegeName = process.env.COLLEGE_NAME || 'Your College';
    const canteenName = process.env.CANTEEN_NAME || 'Main Canteen';
    const pickupLocation = process.env.PICKUP_LOCATION || 'Canteen Counter';
    
    // Calculate estimated pickup time (order time + 15-20 minutes)
    const currentTime = new Date();
    const pickupTime = new Date(currentTime.getTime() + (18 * 60 * 1000)); // 18 minutes from now
    const estimatedPickupTime = pickupTime.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const itemsList = items.map(item => 
      `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.quantity * item.price).toFixed(2)}</td>
      </tr>`
    ).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Order Token - ${token}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
            <div style="background: white; padding: 10px; border-radius: 8px; margin-right: 15px;">
              <img src="https://canteenqr.onrender.com/assets/images/college_logo.jpg" alt="College Logo" style="height: 40px; width: auto; display: block;">
            </div>
            <div style="text-align: left;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Order Confirmed!</h1>
              <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">${collegeName} - ${canteenName}</p>
            </div>
          </div>
        </div>

        <!-- Token Display -->
        <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-bottom: 3px solid #667eea;">
          <h2 style="margin: 0; color: #333; font-size: 20px;">Your Token Number</h2>
          <div style="background-color: #667eea; color: white; padding: 20px; margin: 20px 0; border-radius: 10px; display: inline-block;">
            <span style="font-size: 48px; font-weight: bold; letter-spacing: 3px;">${token}</span>
          </div>
          <p style="margin: 0; color: #666; font-size: 16px;">Please show this token at pickup</p>
        </div>

        <!-- QR Code Section -->
        ${(qrCodeDataUrl || hasQrAttachment) ? `
        <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-bottom: 1px solid #eee;">
          <h2 style="margin: 0 0 20px 0; color: #333; font-size: 20px;">QR Code for Quick Pickup</h2>
          <div style="display: inline-block; background: white; padding: 20px; border-radius: 10px; border: 2px solid #667eea;">
            ${hasQrAttachment ? 
              `<img src="cid:orderqr" alt="Order QR Code" style="width: 200px; height: 200px; display: block; max-width: 100%;">` :
              `<img src="${qrCodeDataUrl}" alt="Order QR Code" style="width: 200px; height: 200px; display: block; max-width: 100%;">`
            }
          </div>
          <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">Show this QR code at the pickup counter for faster service</p>
          <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">Can't see the QR code? Use your token number instead: <strong>${token}</strong></p>
        </div>
        ` : `
        <div style="background-color: #fff3cd; padding: 20px; text-align: center; border-bottom: 1px solid #eee;">
          <p style="margin: 0; color: #856404; font-size: 14px;">📱 QR code unavailable - Please show your token number at pickup: <strong>${token}</strong></p>
        </div>
        `}

        <!-- Order Details -->
        <div style="padding: 30px;">
          <h3 style="margin: 0 0 20px 0; color: #333; font-size: 20px;">Order Details</h3>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0 0 8px 0; color: #666;"><strong>Customer:</strong> ${userName}</p>
            <p style="margin: 0 0 8px 0; color: #666;"><strong>Order Time:</strong> ${orderTime}</p>
            <p style="margin: 0 0 8px 0; color: #666;"><strong>Estimated Pickup:</strong> ${estimatedPickupTime}</p>
            <p style="margin: 0; color: #666;"><strong>Order ID:</strong> #${orderId}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 12px 8px; text-align: left; color: #333; font-weight: bold; border-bottom: 2px solid #dee2e6;">Item</th>
                <th style="padding: 12px 8px; text-align: center; color: #333; font-weight: bold; border-bottom: 2px solid #dee2e6;">Qty</th>
                <th style="padding: 12px 8px; text-align: right; color: #333; font-weight: bold; border-bottom: 2px solid #dee2e6;">Price</th>
                <th style="padding: 12px 8px; text-align: right; color: #333; font-weight: bold; border-bottom: 2px solid #dee2e6;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 15px 8px; text-align: right; font-weight: bold; color: #333; border-top: 2px solid #dee2e6;">Total Amount:</td>
                <td style="padding: 15px 8px; text-align: right; font-weight: bold; color: #667eea; font-size: 18px; border-top: 2px solid #dee2e6;">₹${totalAmount}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Pickup Instructions -->
        <div style="background-color: #e8f4fd; padding: 20px 30px; border-left: 4px solid #667eea;">
          <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">📍 Pickup Instructions</h4>
          <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.6;">
            <li style="margin-bottom: 8px;">Show this email or your token number: <strong style="color: #667eea;">${token}</strong></li>
            <li style="margin-bottom: 8px;">Visit the pickup counter at: <strong>${pickupLocation}</strong></li>
            <li style="margin-bottom: 8px;">Estimated ready time: <strong style="color: #28a745;">${estimatedPickupTime}</strong></li>
            <li style="margin-bottom: 8px;">Please wait for your token to be called</li>
            <li>Have a valid college ID ready</li>
          </ul>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px;">
          <p style="margin: 0 0 10px 0;">Thank you for using our QR ordering system!</p>
          <p style="margin: 0; font-size: 12px; opacity: 0.8;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate plain text version of order token email
   */
  generateOrderTokenText({ userName, token, items, totalAmount }) {
    const collegeName = process.env.COLLEGE_NAME || 'Your College';
    const canteenName = process.env.CANTEEN_NAME || 'Main Canteen';
    const pickupLocation = process.env.PICKUP_LOCATION || 'Canteen Counter';

    const itemsList = items.map(item => 
      `${item.name} x${item.quantity} - ₹${(item.quantity * item.price).toFixed(2)}`
    ).join('\n');

    return `
ORDER CONFIRMED - ${collegeName}

Hi ${userName},

Your order has been confirmed! Here are the details:

TOKEN NUMBER: ${token}
Please save this token number for pickup.

ORDER SUMMARY:
${itemsList}

TOTAL AMOUNT: ₹${totalAmount}

PICKUP INSTRUCTIONS:
- Show this token number: ${token}
- Visit: ${pickupLocation}
- Wait for your token to be called
- Have your college ID ready

Thank you for using our QR ordering system!

---
This is an automated email. Please do not reply.
${canteenName} - ${collegeName}
    `;
  }

  /**
   * Generate HTML email template for status updates
   */
  generateStatusUpdateEmail({ userName, token, status }) {
    const collegeName = process.env.COLLEGE_NAME || 'Your College';
    const canteenName = process.env.CANTEEN_NAME || 'Main Canteen';
    const pickupLocation = process.env.PICKUP_LOCATION || 'Canteen Counter';

    const statusConfig = {
      ready: {
        title: 'Order Ready for Pickup!',
        message: 'Your order is ready and waiting for you at the pickup counter.',
        color: '#28a745',
        action: 'Please collect your order as soon as possible.'
      },
      completed: {
        title: 'Order Completed',
        message: 'Thank you for your order! We hope you enjoyed your meal.',
        color: '#6f42c1',
        action: 'We appreciate your business!'
      }
    };

    const config = statusConfig[status] || statusConfig.ready;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${config.title} - ${token}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background-color: ${config.color}; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">${config.title}</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${collegeName} - ${canteenName}</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px; text-align: center;">
          <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 10px; border-left: 4px solid ${config.color};">
            <h2 style="margin: 0 0 10px 0; color: #333;">Token: ${token}</h2>
            <p style="margin: 0; color: #666; font-size: 16px;">${config.message}</p>
          </div>

          <div style="margin: 30px 0;">
            <p style="font-size: 18px; color: #333; margin: 0;">${config.action}</p>
            ${status === 'ready' ? `<p style="color: #666; margin: 10px 0 0 0;">Pickup Location: <strong>${pickupLocation}</strong></p>` : ''}
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px;">
          <p style="margin: 0 0 10px 0;">Thank you for using our QR ordering system!</p>
          <p style="margin: 0; font-size: 12px; opacity: 0.8;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate plain text version of status update email
   */
  generateStatusUpdateText({ userName, token, status }) {
    const collegeName = process.env.COLLEGE_NAME || 'Your College';
    const canteenName = process.env.CANTEEN_NAME || 'Main Canteen';
    const pickupLocation = process.env.PICKUP_LOCATION || 'Canteen Counter';

    const statusMessages = {
      ready: `Hi ${userName},

Great news! Your order is ready for pickup.

TOKEN: ${token}
STATUS: Ready for Pickup

Please visit ${pickupLocation} to collect your order.

Thank you for using our QR ordering system!`,
      completed: `Hi ${userName},

Your order has been completed.

TOKEN: ${token}
STATUS: Completed

Thank you for your order! We hope you enjoyed your meal.`
    };

    return statusMessages[status] || statusMessages.ready + `\n\n---\n${canteenName} - ${collegeName}`;
  }

  /**
   * Test email configuration
   * @returns {boolean} Test result
   */
  async testEmailConfiguration() {
    if (!this.isConfigured) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email configuration test passed');
      return true;
    } catch (error) {
      console.error('❌ Email configuration test failed:', error.message);
      return false;
    }
  }
}

// Singleton instance
let emailService = null;

function getEmailService() {
  if (!emailService) {
    emailService = new EmailService();
  }
  return emailService;
}

module.exports = {
  EmailService,
  getEmailService
};