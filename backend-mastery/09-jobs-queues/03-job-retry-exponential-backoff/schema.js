/**
 * Job Retry Validation Schema
 */

const Joi = require('joi');

/**
 * Email job submission schema
 */
const emailJobSchema = Joi.object({
  to: Joi.string().email().required(),
  subject: Joi.string().required().max(200),
  body: Joi.string().required().max(5000),
  maxAttempts: Joi.number().optional().min(1).max(10),
  baseDelay: Joi.number().optional().min(100).max(60000)
});

/**
 * API call job schema
 */
const apiCallJobSchema = Joi.object({
  url: Joi.string().uri().required(),
  method: Joi.string().optional().valid('GET', 'POST', 'PUT', 'DELETE'),
  data: Joi.object().optional(),
  maxRetries: Joi.number().optional().min(0).max(10),
  backoffType: Joi.string().optional().valid('exponential', 'fixed', 'linear')
});

/**
 * Data processing job schema
 */
const dataProcessingJobSchema = Joi.object({
  dataId: Joi.string().required(),
  processingType: Joi.string().required(),
  priority: Joi.string().optional().valid('low', 'normal', 'high')
});

/**
 * Validate email job
 */
exports.validateEmailJob = (req, res, next) => {
  const { error, value } = emailJobSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  req.validatedBody = value;
  next();
};

/**
 * Validate API call job
 */
exports.validateApiCallJob = (req, res, next) => {
  const { error, value } = apiCallJobSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  req.validatedBody = value;
  next();
};

/**
 * Validate data processing job
 */
exports.validateDataProcessingJob = (req, res, next) => {
  const { error, value } = dataProcessingJobSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  req.validatedBody = value;
  next();
};

module.exports.emailJobSchema = emailJobSchema;
module.exports.apiCallJobSchema = apiCallJobSchema;
module.exports.dataProcessingJobSchema = dataProcessingJobSchema;

