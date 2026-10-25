const Joi = require('joi');

const submitJobSchema = Joi.object({
  jobName: Joi.string().max(100).required(),
  priority: Joi.string().valid('critical', 'high', 'normal', 'low').required(),
  payload: Joi.object().required(),
  estimatedDuration: Joi.number().min(100).optional(),
  deadline: Joi.date().optional()
});

const getQueueSchema = Joi.object({
  priority: Joi.string().valid('all', 'critical', 'high', 'normal', 'low').optional()
});

const jobInfoSchema = Joi.object({
  jobId: Joi.string().required()
});

const statisticsSchema = Joi.object({
  timeRange: Joi.string().valid('1h', '24h', '7d', '30d').optional()
});

module.exports = {
  submitJobSchema,
  getQueueSchema,
  jobInfoSchema,
  statisticsSchema
};

