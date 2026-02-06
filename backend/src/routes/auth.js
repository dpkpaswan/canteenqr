/**
 * Authentication routes
 * Handles Google OAuth login and token management
 */

const express = require('express');
const { getAuthService, checkServiceHealth } = require('../services');
const { validate } = require('../middleware/validateRequest');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route POST /api/auth/google-login
 * @desc Authenticate user with Google ID token
 * @access Public
 */
router.post('/google-login', validate.googleLogin, asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  const authService = getAuthService();

  const authResult = await authService.googleLogin(idToken);

  res.status(200).json({
    success: true,
    message: 'Authentication successful',
    data: authResult,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route POST /api/auth/verify-token
 * @desc Verify JWT token validity
 * @access Private
 */
router.post('/verify-token', authenticateToken, asyncHandler(async (req, res) => {
  // If we reach here, token is valid (middleware already verified it)
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user,
      valid: true
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      user: req.user
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route POST /api/auth/refresh
 * @desc Refresh authentication token
 * @access Private
 */
router.post('/refresh', authenticateToken, asyncHandler(async (req, res) => {
  const authService = getAuthService();

  // Generate new token with current user info
  const newToken = authService.generateJWT({
    googleId: req.user.googleId,
    email: req.user.email,
    name: req.user.name
  });

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      token: newToken,
      user: req.user,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/auth/health
 * @desc Check authentication service health
 * @access Public
 */
router.get('/health', asyncHandler(async (req, res) => {
  const health = await checkServiceHealth();

  res.status(200).json({
    success: true,
    message: 'Authentication service health check',
    data: {
      auth: health.auth,
      timestamp: new Date().toISOString()
    }
  });
}));

module.exports = router;