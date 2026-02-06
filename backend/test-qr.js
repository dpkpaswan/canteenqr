/**
 * Quick test to verify QR code generation for email
 */

const QRCode = require('qrcode');

async function testQRGeneration() {
  console.log('🧪 Testing QR Code Generation...');
  
  const testData = {
    orderId: 'test-order-123',
    token: 'T-001',
    date: new Date().toISOString().split('T')[0],
    customerName: 'Test Student'
  };

  try {
    // Generate QR with same options as email service
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(testData), {
      width: 180,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    console.log('✅ QR Generation Successful!');
    console.log('📊 QR Data:', JSON.stringify(testData));
    console.log('🖼️  QR Base64 Preview:', qrCodeDataUrl.substring(0, 80) + '...');
    console.log('📏 QR Code Length:', qrCodeDataUrl.length);
    console.log('📋 Format:', qrCodeDataUrl.startsWith('data:image/png;base64,') ? 'Valid Base64 PNG' : 'Invalid Format');
    
    // Simulate email template injection
    const emailPreview = `
    <img src="${qrCodeDataUrl}" alt="Order QR Code" style="width: 180px; height: 180px; display: block; max-width: 100%;">
    `;
    console.log('📧 Email HTML Preview Generated Successfully');
    
  } catch (error) {
    console.error('❌ QR Generation Failed:', error.message);
  }
}

// Run test if called directly
if (require.main === module) {
  testQRGeneration();
}

module.exports = testQRGeneration;