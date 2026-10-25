const Joi = require('joi');

// ==================== Vehicle Schema ====================

const vehicleSchema = Joi.object({
  type: Joi.string()
    .valid('car', 'bike', 'truck')
    .required()
    .messages({
      'any.only': 'Type must be car, bike, or truck',
      'any.required': 'Type is required'
    }),
  brand: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Brand must be at least 2 characters',
      'any.required': 'Brand is required'
    }),
  model: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Model must be at least 2 characters',
      'any.required': 'Model is required'
    }),
  year: Joi.number()
    .integer()
    .min(1950)
    .max(new Date().getFullYear() + 1)
    .required()
    .messages({
      'number.min': 'Year must be 1950 or later',
      'any.required': 'Year is required'
    })
});

// ==================== Notification Schema ====================

const notificationSchema = Joi.object({
  type: Joi.string()
    .valid('email', 'sms', 'push')
    .required()
    .messages({
      'any.only': 'Type must be email, sms, or push',
      'any.required': 'Type is required'
    }),
  recipient: Joi.string()
    .required()
    .messages({
      'any.required': 'Recipient is required (email, phone, or user ID)'
    }),
  message: Joi.string()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Message cannot be empty',
      'any.required': 'Message is required'
    }),
  subject: Joi.string()
    .max(100)
    .messages({
      'string.max': 'Subject cannot exceed 100 characters'
    }),
  title: Joi.string()
    .max(100)
    .messages({
      'string.max': 'Title cannot exceed 100 characters'
    })
});

// ==================== Logger Schema ====================

const loggerSchema = Joi.object({
  type: Joi.string()
    .valid('console', 'file', 'database')
    .required()
    .messages({
      'any.only': 'Type must be console, file, or database',
      'any.required': 'Type is required'
    }),
  config: Joi.object({
    filename: Joi.string().max(100),
    database: Joi.string().max(100)
  })
});

// ==================== Validation Function ====================

const validateInputData = (data, type) => {
  const schemas = {
    vehicle: vehicleSchema,
    notification: notificationSchema,
    logger: loggerSchema
  };

  if (!schemas[type]) {
    return {
      error: null,
      value: data
    };
  }

  return schemas[type].validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
};

module.exports = {
  vehicleSchema,
  notificationSchema,
  loggerSchema,
  validateInputData
};
