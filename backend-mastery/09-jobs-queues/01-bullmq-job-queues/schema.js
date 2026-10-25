/**
 * BullMQ Job Schemas
 * Validation schemas for queue jobs
 */

const Joi = require('joi');

// Email job schema
exports.emailJobSchema = Joi.object({
  to: Joi.string().email().required(),
  subject: Joi.string().max(200).required(),
  body: Joi.string().max(5000).required(),
  priority: Joi.number().min(1).max(10).default(5),
  delay: Joi.number().min(0).optional()
});

// Report job schema
exports.reportJobSchema = Joi.object({
  userId: Joi.number().required(),
  reportType: Joi.string()
    .valid('sales', 'analytics', 'inventory', 'financial')
    .required(),
  format: Joi.string().valid('pdf', 'csv', 'excel').required(),
  priority: Joi.number().min(1).max(10).default(5),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional()
});

// Bulk job schema
exports.bulkJobSchema = Joi.object({
  items: Joi.array()
    .items(Joi.object())
    .min(1)
    .required(),
  queueName: Joi.string().default('batch')
});

// Job control schema
exports.jobControlSchema = Joi.object({
  jobId: Joi.string().required(),
  queueName: Joi.string().required()
});

// Validate request body
exports.validateEmail = (req, res, next) => {
  const { error, value } = exports.emailJobSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  req.validatedBody = value;
  next();
};

exports.validateReport = (req, res, next) => {
  const { error, value } = exports.reportJobSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  req.validatedBody = value;
  next();
};

exports.validateBulk = (req, res, next) => {
  const { error, value } = exports.bulkJobSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  req.validatedBody = value;
  next();
};

