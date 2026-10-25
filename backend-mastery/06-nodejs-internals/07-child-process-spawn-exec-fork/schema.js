/**
 * Child Process - Validation Schemas
 */

const Joi = require('joi');

exports.childProcessOps = Joi.object({
  command: Joi.string().max(255).optional(),
  type: Joi.string().valid('spawn', 'exec', 'fork').optional(),
  timeout: Joi.number().integer().min(100).max(30000).optional(),
});
