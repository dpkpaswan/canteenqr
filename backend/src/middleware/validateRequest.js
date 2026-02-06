/**
 * Request validation middleware
 * Uses Joi for request validation
 */

const Joi = require('joi');

/**
 * Middleware factory for validating requests
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'params', 'query')
 */
function validateRequest(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Replace request data with validated/cleaned data
    req[property] = value;
    next();
  };
}

// Common validation schemas
const schemas = {
  // Google OAuth login
  googleLogin: Joi.object({
    idToken: Joi.string().required().messages({
      'string.empty': 'Google ID token is required',
      'any.required': 'Google ID token is required'
    })
  }),

  // Order creation
  createOrder: Joi.object({
    items: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        name: Joi.string().required().min(1).max(100),
        price: Joi.number().positive().precision(2).required(),
        quantity: Joi.number().integer().positive().max(20).required(),
        category: Joi.string().optional(),
        description: Joi.string().optional().max(255)
      })
    ).min(1).required().messages({
      'array.min': 'At least one item is required',
      'array.base': 'Items must be an array',
      'any.required': 'Items are required'
    }),
    phone: Joi.string().pattern(/^[+]?[1-9]\d{9,14}$/).optional().messages({
      'string.pattern.base': 'Phone number must be valid'
    }),
    specialInstructions: Joi.string().max(500).optional()
  }),

  // Payment verification
  verifyPayment: Joi.object({
    razorpay_order_id: Joi.string().required().messages({
      'any.required': 'Razorpay order ID is required'
    }),
    razorpay_payment_id: Joi.string().required().messages({
      'any.required': 'Razorpay payment ID is required'
    }),
    razorpay_signature: Joi.string().required().messages({
      'any.required': 'Razorpay signature is required'
    }),
    orderData: Joi.object({
      items: Joi.array().items(
        Joi.object({
          id: Joi.string().required(),
          name: Joi.string().required(),
          price: Joi.number().positive().required(),
          quantity: Joi.number().integer().positive().required()
        })
      ).required(),
      phone: Joi.string().pattern(/^[+]?[1-9]\d{9,14}$/).optional()
    }).required()
  }),

  // Update order status
  updateStatus: Joi.object({
    status: Joi.string().valid('pending', 'preparing', 'ready', 'completed').required().messages({
      'any.only': 'Status must be one of: pending, preparing, ready, completed',
      'any.required': 'Status is required'
    })
  }),

  // Find token
  findToken: Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^[+]?[1-9]\d{9,14}$/).optional()
  }).or('email', 'phone').messages({
    'object.missing': 'Either email or phone is required'
  }),

  // Pagination query
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('pending', 'preparing', 'ready', 'completed').optional()
  }),

  // UUID parameter
  uuidParam: Joi.object({
    id: Joi.string().guid({ version: 'uuidv4' }).required().messages({
      'string.guid': 'Invalid order ID format',
      'any.required': 'Order ID is required'
    })
  }),

  // Token parameter
  tokenParam: Joi.object({
    token: Joi.string().pattern(/^[A-Z]-\d{3}$/).required().messages({
      'string.pattern.base': 'Invalid token format',
      'any.required': 'Token is required'
    })
  })
};

// Validation middleware for common use cases
const validate = {
  googleLogin: validateRequest(schemas.googleLogin),
  createOrder: validateRequest(schemas.createOrder),
  verifyPayment: validateRequest(schemas.verifyPayment),
  updateStatus: validateRequest(schemas.updateStatus),
  findToken: validateRequest(schemas.findToken),
  pagination: validateRequest(schemas.pagination, 'query'),
  uuidParam: validateRequest(schemas.uuidParam, 'params'),
  tokenParam: validateRequest(schemas.tokenParam, 'params')
};

module.exports = {
  validateRequest,
  schemas,
  validate
};