const Joi = require('joi');

/**
 * Get config schema - retrieve current configuration
 */
const getConfigSchema = Joi.object({
  key: Joi.string().max(100).optional(),
  environment: Joi.string().valid('development', 'staging', 'production').optional()
});

/**
 * Update config schema - modify configuration
 */
const updateConfigSchema = Joi.object({
  database_url: Joi.string().uri().optional(),
  redis_url: Joi.string().uri().optional(),
  api_timeout: Joi.number().min(100).max(60000).optional(),
  max_retries: Joi.number().min(0).max(10).optional(),
  cache_ttl: Joi.number().min(0).max(86400).optional(),
  log_level: Joi.string().valid('debug', 'info', 'warn', 'error').optional(),
  features_enabled: Joi.object().optional(),
  rate_limit_requests: Joi.number().min(1).max(10000).optional(),
  rate_limit_window: Joi.number().min(1000).max(3600000).optional(),
  custom_settings: Joi.object().optional()
});

/**
 * Validate schema - check config item
 */
const validateConfigSchema = Joi.object({
  key: Joi.string().max(100).required(),
  value: Joi.any().required()
});

/**
 * Query schema - pagination params
 */
const querySchema = Joi.object({
  limit: Joi.number().default(50).max(500),
  offset: Joi.number().default(0),
  environment: Joi.string().valid('development', 'staging', 'production').optional()
});

/**
 * ID schema - key validation
 */
const idSchema = Joi.object({
  id: Joi.string().max(100).required()
});

module.exports = {
  getConfigSchema,
  updateConfigSchema,
  validateConfigSchema,
  querySchema,
  idSchema
};
