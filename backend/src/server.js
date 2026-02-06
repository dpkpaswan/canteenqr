/**
 * Main server file for College Canteen QR Token Ordering System
 * Production-ready Express.js server with comprehensive middleware
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const vendorRoutes = require('./routes/vendor');
const tokenRoutes = require('./routes/tokens');
const menuRoutes = require('./routes/menu');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { validate } = require('./middleware/validateRequest');

// Import services
const { initializeServices } = require('./services');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
initializeServices();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration for production deployment
app.use(cors({
  origin: function (origin, callback) {
    const defaultOrigins = [
      'http://localhost:4028',
      'http://localhost:5173', 
      'http://127.0.0.1:4028',
      'http://192.168.1.15:4028', // Mobile access via local IP
      'https://192.168.1.15:4028' // HTTPS mobile access
    ];
    
    // Add production origin from environment variable
    const productionOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : [];
    const allowedOrigins = [...defaultOrigins, ...productionOrigins];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check against allowed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow local network IPs (192.168.x.x range)
    if (origin.match(/^https?:\/\/192\.168\.[0-9]+\.[0-9]+:[0-9]+$/)) {
      return callback(null, true);
    }
    
    // Allow Vercel preview deployments
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    // Allow Render deployments
    if (origin.includes('.onrender.com')) {
      return callback(null, true);
    }
    
    // Allow Google OAuth domains
    if (origin.includes('accounts.google.com') || origin.includes('googleapis.com')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization']
}));

// Add additional headers for Google OAuth compatibility
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Canteen QR Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/menu', menuRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

// Start server - bind to all interfaces for mobile access
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Canteen QR Backend API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📱 Mobile access: http://192.168.1.15:${PORT}/health`);
  console.log(`📚 API base URL: http://localhost:${PORT}/api`);
  console.log(`📱 Mobile API: http://192.168.1.15:${PORT}/api`);
});

module.exports = app;