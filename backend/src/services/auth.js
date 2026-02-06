/**
 * Google OAuth authentication service
 * Handles Google ID token verification and user authentication
 */

const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

class AuthService {
  constructor() {
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new Error('Google Client ID not configured. Please check environment variables.');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT Secret not configured. Please check environment variables.');
    }

    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    console.log('✅ Google OAuth service initialized');
  }

  /**
   * Verify Google ID token and extract user information
   * @param {string} idToken - Google ID token from frontend
   * @returns {Object} User information
   */
  async verifyGoogleToken(idToken) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new Error('Invalid Google token payload');
      }

      // Extract user information
      const userInfo = {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        emailVerified: payload.email_verified
      };

      // Verify email is verified
      if (!userInfo.emailVerified) {
        throw new Error('Email not verified with Google');
      }

      console.log(`✅ Google token verified for: ${userInfo.email}`);
      return userInfo;
    } catch (error) {
      console.error('❌ Google token verification failed:', error.message);
      throw new Error('Invalid Google authentication token');
    }
  }

  /**
   * Generate JWT token for authenticated user
   * @param {Object} userInfo - User information from Google
   * @returns {string} JWT token
   */
  generateJWT(userInfo) {
    try {
      const payload = {
        sub: userInfo.googleId,
        email: userInfo.email,
        name: userInfo.name,
        iat: Math.floor(Date.now() / 1000),
        type: 'access'
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'canteen-qr-backend',
        audience: 'canteen-qr-frontend'
      });

      console.log(`✅ JWT generated for: ${userInfo.email}`);
      return token;
    } catch (error) {
      console.error('❌ JWT generation failed:', error.message);
      throw new Error('Failed to generate authentication token');
    }
  }

  /**
   * Verify and decode JWT token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   */
  verifyJWT(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'canteen-qr-backend',
        audience: 'canteen-qr-frontend'
      });

      return decoded;
    } catch (error) {
      console.error('❌ JWT verification failed:', error.message);
      throw new Error('Invalid or expired authentication token');
    }
  }

  /**
   * Extract JWT token from Authorization header
   * @param {string} authHeader - Authorization header value
   * @returns {string|null} JWT token or null
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  /**
   * Authenticate user from request
   * @param {Object} req - Express request object
   * @returns {Object} User information
   */
  async authenticateRequest(req) {
    try {
      const authHeader = req.headers.authorization;
      const token = this.extractTokenFromHeader(authHeader);

      if (!token) {
        throw new Error('No authentication token provided');
      }

      const decoded = this.verifyJWT(token);
      
      // Add user info to request for downstream use
      req.user = {
        googleId: decoded.sub,
        email: decoded.email,
        name: decoded.name
      };

      return req.user;
    } catch (error) {
      console.error('❌ Request authentication failed:', error.message);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Complete Google OAuth login flow
   * @param {string} googleIdToken - Google ID token from frontend
   * @returns {Object} Authentication result with JWT
   */
  async googleLogin(googleIdToken) {
    try {
      // Verify Google token and extract user info
      const userInfo = await this.verifyGoogleToken(googleIdToken);

      // Generate our JWT token
      const jwtToken = this.generateJWT(userInfo);

      const authResult = {
        success: true,
        user: {
          googleId: userInfo.googleId,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture
        },
        token: jwtToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      };

      console.log(`✅ Authentication successful for: ${userInfo.email}`);
      return authResult;
    } catch (error) {
      console.error('❌ Google login failed:', error.message);
      throw error;
    }
  }
}

// Singleton instance
let authService = null;

function getAuthService() {
  if (!authService) {
    authService = new AuthService();
  }
  return authService;
}

module.exports = {
  AuthService,
  getAuthService
};