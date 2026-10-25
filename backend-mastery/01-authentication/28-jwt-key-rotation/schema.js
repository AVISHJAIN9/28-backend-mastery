const Joi = require('joi');

exports.registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required(),
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
});

exports.verifySchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Token is required'
    })
});

exports.rotateKeysSchema = Joi.object({
  gracePeriod: Joi.number()
    .min(1)
    .max(168)
    .optional()
    .messages({
      'number.min': 'Grace period must be at least 1 hour',
      'number.max': 'Grace period cannot exceed 168 hours (1 week)'
    })
});
