/**
 * Service initialization and exports
 * Centralized service management for the application
 */

const { getDatabaseService } = require('./database');
const { getAuthService } = require('./auth');
const { getPaymentService } = require('./payment');
const { getEmailService } = require('./email');

/**
 * Initialize all services
 */
async function initializeServices() {
  console.log('🚀 Initializing services...');

  try {
    // Initialize database service
    const dbService = getDatabaseService();
    await dbService.initializeTables();

    // Initialize other services
    getAuthService();
    getPaymentService();
    await getEmailService();

    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Service initialization failed:', error.message);
    throw error;
  }
}

/**
 * Get all service instances
 */
function getServices() {
  return {
    database: getDatabaseService(),
    auth: getAuthService(),
    payment: getPaymentService(),
    email: getEmailService()
  };
}

/**
 * Health check for all services
 */
async function checkServiceHealth() {
  const health = {
    database: false,
    auth: false,
    payment: false,
    email: false
  };

  try {
    // Check database
    const dbService = getDatabaseService();
    await dbService.getTodayStats();
    health.database = true;
  } catch (error) {
    console.error('Database health check failed:', error.message);
  }

  try {
    // Check auth service
    const authService = getAuthService();
    health.auth = true; // Auth service is initialized if no errors
  } catch (error) {
    console.error('Auth service health check failed:', error.message);
  }

  try {
    // Check payment service
    const paymentService = getPaymentService();
    health.payment = paymentService.isConfigurationValid();
  } catch (error) {
    console.error('Payment service health check failed:', error.message);
  }

  try {
    // Check email service
    const emailService = getEmailService();
    health.email = await emailService.testEmailConfiguration();
  } catch (error) {
    console.error('Email service health check failed:', error.message);
  }

  return health;
}

module.exports = {
  initializeServices,
  getServices,
  getDatabaseService,
  getAuthService,
  getPaymentService,
  getEmailService,
  checkServiceHealth
};