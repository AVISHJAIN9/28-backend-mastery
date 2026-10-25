const Joi = require('joi');

const submitJobSchema = Joi.object({
  taskType: Joi.string().valid('cpu-intensive', 'io-intensive', 'memory-intensive').required(),
  duration: Joi.number().min(100).max(30000).required(),
  priority: Joi.string().valid('high', 'normal', 'low').optional(),
  dataSize: Joi.number().min(1).optional()
});

const getJobSchema = Joi.object({
  jobId: Joi.string().required()
});

const recommendationSchema = Joi.object({
  systemType: Joi.string().valid('cpu-bound', 'io-bound', 'memory-bound').required()
});

const concurrencySchema = Joi.object({
  queueName: Joi.string().valid('high-concurrency', 'low-concurrency', 'adaptive').required()
});

module.exports = {
  submitJobSchema,
  getJobSchema,
  recommendationSchema,
  concurrencySchema
};

