const Joi = require('joi');

// ==================== Order Schema ====================

exports.createOrderSchema = Joi.object({
  amount: Joi.number()
    .positive()
    .max(999999)
    .required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'number.max': 'Amount cannot exceed 999999',
      'any.required': 'Amount is required'
    }),

  description: Joi.string()
    .min(3)
    .max(500)
    .required()
    .messages({
      'string.min': 'Description must be at least 3 characters',
      'string.max': 'Description cannot exceed 500 characters',
      'any.required': 'Description is required'
    }),

  customerId: Joi.string()
    .alphanum()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.alphanum': 'CustomerId must contain only alphanumeric characters',
      'string.min': 'CustomerId must be at least 3 characters',
      'string.max': 'CustomerId cannot exceed 100 characters',
      'any.required': 'CustomerId is required'
    })
});

// ==================== Payment Schema ====================

exports.createPaymentSchema = Joi.object({
  amount: Joi.number()
    .positive()
    .max(999999)
    .required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required'
    }),

  currency: Joi.string()
    .length(3)
    .uppercase()
    .required()
    .valid('USD', 'EUR', 'GBP', 'INR')
    .messages({
      'string.length': 'Currency must be 3 characters',
      'any.only': 'Currency must be USD, EUR, GBP, or INR',
      'any.required': 'Currency is required'
    }),

  description: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),

  customerId: Joi.string()
    .alphanum()
    .min(3)
    .max(100)
    .required()
    .messages({
      'any.required': 'CustomerId is required'
    })
});

// ==================== Webhook Event Schema ====================

exports.webhookEventSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string().required(),
  object: Joi.string().valid('event').required(),
  api_version: Joi.string(),
  created: Joi.number().required(),
  data: Joi.object({
    object: Joi.object().required(),
    previous_attributes: Joi.object()
  }).required(),
  livemode: Joi.boolean().required(),
  pending_webhooks: Joi.number(),
  request: Joi.object({
    id: Joi.string().allow(null),
    idempotency_key: Joi.string().allow(null)
  })
});

// ==================== Validation Helper ====================

exports.validateOrderInput = (data) => {
  return exports.createOrderSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
};

exports.validatePaymentInput = (data) => {
  return exports.createPaymentSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
};

exports.validateWebhookEvent = (data) => {
  return exports.webhookEventSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
};

module.exports = exports;
