const Joi = require('joi');

exports.loginSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.min': 'Username must be at least 3 characters',
      'any.required': 'Username is required'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required'
    })
});

exports.changePasswordSchema = Joi.object({
  oldPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and numbers',
      'any.required': 'New password is required'
    })
});

exports.searchSchema = Joi.object({
  query: Joi.string()
    .min(2)
    .required()
    .messages({
      'string.min': 'Search query must be at least 2 characters',
      'any.required': 'Search query is required'
    }),
  limit: Joi.number()
    .min(1)
    .max(100)
    .optional()
});
