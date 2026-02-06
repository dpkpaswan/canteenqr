/**
 * Global error handling middleware
 * Centralized error handling for the application
 */

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 */
function errorHandler(err, req, res, next) {
  // Default error values
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('❌ Error occurred:', {
    message: error.message,
    status: error.statusCode || 500,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Supabase/PostgreSQL errors
  if (err.code === 'PGRST116') {
    error = new AppError('Resource not found', 404);
  }

  if (err.code === '23505') { // Unique constraint violation
    error = new AppError('Duplicate entry found', 409);
  }

  if (err.code === '23503') { // Foreign key constraint violation
    error = new AppError('Invalid reference', 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid authentication token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Authentication token expired', 401);
  }

  // Validation errors (Joi)
  if (err.name === 'ValidationError') {
    const message = err.details?.map(detail => detail.message).join(', ') || 'Validation failed';
    error = new AppError(message, 400);
  }

  // Razorpay errors
  if (err.error?.code === 'BAD_REQUEST_ERROR') {
    error = new AppError('Payment request failed', 400);
  }

  if (err.error?.code === 'GATEWAY_ERROR') {
    error = new AppError('Payment gateway error', 502);
  }

  // Mongoose/MongoDB errors (if used)
  if (err.name === 'CastError') {
    error = new AppError('Invalid resource ID', 400);
  }

  if (err.name === 'MongoError' && err.code === 11000) {
    error = new AppError('Duplicate entry found', 409);
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new AppError('File size too large', 413);
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error = new AppError('Too many files uploaded', 413);
  }

  // Rate limiting errors
  if (err.status === 429) {
    error = new AppError('Too many requests, please try again later', 429);
  }

  // Default to 500 internal server error
  if (!error.statusCode) {
    error = new AppError('Internal server error', 500, false);
  }

  // Create error response
  const errorResponse = {
    success: false,
    message: error.message,
    timestamp: error.timestamp || new Date().toISOString()
  };

  // Add error details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = {
      status: error.statusCode,
      stack: err.stack,
      originalError: err
    };
  }

  // Add request ID if available
  if (req.id) {
    errorResponse.requestId = req.id;
  }

  // Send error response
  res.status(error.statusCode).json(errorResponse);
}

/**
 * Async error wrapper to avoid try-catch in every controller
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler for undefined routes
 */
function notFoundHandler(req, res, next) {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
}

/**
 * Validation error formatter
 */
function formatValidationErrors(errors) {
  return errors.map(error => ({
    field: error.path?.join('.') || error.field,
    message: error.message,
    value: error.value
  }));
}

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  formatValidationErrors
};