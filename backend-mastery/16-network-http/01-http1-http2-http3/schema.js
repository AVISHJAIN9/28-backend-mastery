const Joi = require('joi');

// Validation schemas for HTTP versions module
const schemas = {
  // Request validation for protocol test
  protocolTest: Joi.object({
    message: Joi.string().max(200).optional(),
    includeHeaders: Joi.boolean().optional()
  }),

  // Request validation for feature comparison
  featureComparison: Joi.object({
    protocol: Joi.string()
      .valid('HTTP/1.0', 'HTTP/1.1', 'HTTP/2', 'HTTP/3')
      .optional()
  }),

  // Request validation for push data
  pushData: Joi.object({
    userId: Joi.number().required(),
    files: Joi.array()
      .items(Joi.object({
        name: Joi.string().required(),
        size: Joi.number().required()
      }))
      .optional()
  })
};

module.exports = schemas;

