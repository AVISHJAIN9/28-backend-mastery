/**
 * AsyncLocalStorage - Validation Schemas
 */

const Joi = require('joi');

exports.contextDemo = Joi.object({
  userId: Joi.string().max(50).optional(),
  requestId: Joi.string().uuid().optional(),
  depth: Joi.number().integer().min(1).max(10).optional(),
});
