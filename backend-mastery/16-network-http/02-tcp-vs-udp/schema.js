const Joi = require('joi');

const schemas = {
  socketConnection: Joi.object({
    protocol: Joi.string().valid('TCP', 'UDP').required(),
    host: Joi.string().hostname().optional(),
    port: Joi.number().port().optional(),
    timeout: Joi.number().min(100).max(60000).optional()
  }),

  packetData: Joi.object({
    data: Joi.string().max(65507).required(),
    size: Joi.number().min(1).max(65507).optional()
  }),

  simulationParams: Joi.object({
    packetLossPercentage: Joi.number().min(0).max(100).optional(),
    delayMs: Joi.number().min(0).max(5000).optional(),
    outOfOrderPercentage: Joi.number().min(0).max(100).optional()
  }),

  metricsQuery: Joi.object({
    protocol: Joi.string().valid('TCP', 'UDP', 'both').optional(),
    duration: Joi.number().min(1).max(3600).optional()
  })
};

module.exports = schemas;

