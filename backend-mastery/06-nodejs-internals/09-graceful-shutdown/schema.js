/**
 * Graceful Shutdown - Validation Schemas
 */

const Joi = require('joi');

exports.shutdownConfig = Joi.object({
  timeout: Joi.number().integer().min(1000).max(60000).optional(),
  gracePeriod: Joi.number().integer().min(0).max(30000).optional(),
});
