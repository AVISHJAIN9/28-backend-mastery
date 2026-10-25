const Joi = require('joi');

/**
 * Create/Update schema
 */
exports.createSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  email: Joi.string().email().optional()
});

/**
 * List query schema
 */
exports.querySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
  sortBy: Joi.string().optional(),
  order: Joi.string().valid('asc', 'desc').default('desc')
});
