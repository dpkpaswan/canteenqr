/**
 * Authentication middleware
 * Verifies JWT tokens and protects routes
 */

const { getAuthService } = require('../services');

/**
 * Middleware to authenticate requests using JWT
 */
async function authenticateToken(req, res, next) {
  try {
    const authService = getAuthService();
    await authService.authenticateRequest(req);
    next();
  } catch (error) {
    console.error('❌ Request authentication failed:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: error.message
    });
  }
}

/**
 * Optional authentication middleware
 * Sets user info if token is valid, but doesn't block if no token
 */
async function optionalAuth(req, res, next) {
  try {
    const authService = getAuthService();
    await authService.authenticateRequest(req);
  } catch (error) {
    // Continue without authentication
    req.user = null;
  }
  next();
}

/**
 * Middleware to extract user info from token
 */
function extractUserFromToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const authService = getAuthService();
    const decoded = authService.verifyJWT(token);
    
    req.user = {
      googleId: decoded.sub,
      email: decoded.email,
      name: decoded.name
    };
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
}

module.exports = {
  authenticateToken,
  optionalAuth,
  extractUserFromToken
};