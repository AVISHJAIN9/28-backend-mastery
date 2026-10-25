/**
 * Async/Await Patterns - Validation Schemas
 */

const Joi = require('joi');

exports.asyncPattern = Joi.object({
  delay: Joi.number().integer().min(0).max(5000).optional(),
  count: Joi.number().integer().min(1).max(100).optional(),
});
