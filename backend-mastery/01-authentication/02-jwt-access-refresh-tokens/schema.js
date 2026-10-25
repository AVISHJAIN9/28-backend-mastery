const Joi = require('joi');

/**
 * Register schema - validates user registration data
 */
exports.registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .messages({
      'string.email': 'Must be a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and numbers',
      'any.required': 'Password is required'
    }),
  name: Joi.string()
    .required()
    .min(2)
    .max(100)
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'any.required': 'Name is required'
    })
}).unknown(false);

/**
 * Login schema - validates user login credentials
 */
exports.loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .messages({
      'string.email': 'Must be a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
}).unknown(false);

/**
 * Refresh token schema - validates refresh token request
 */
exports.refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required'
    })
}).unknown(false);

/**
 * Logout schema - validates logout request
 */
exports.logoutSchema = Joi.object({
  refreshToken: Joi.string()
    .allow(null, '')
    .optional()
    .messages({
      'string.base': 'Refresh token must be a string'
    })
}).unknown(false);

