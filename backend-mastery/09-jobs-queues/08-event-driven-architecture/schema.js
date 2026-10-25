const Joi = require('joi');

const publishEventSchema = Joi.object({
  eventName: Joi.string().required(),
  data: Joi.object().required(),
  source: Joi.string().required(),
  timestamp: Joi.date().optional(),
  correlationId: Joi.string().optional(),
  metadata: Joi.object().optional()
});

const subscribeEventSchema = Joi.object({
  eventName: Joi.string().required(),
  subscriberId: Joi.string().required(),
  filter: Joi.object().optional(),
  retryPolicy: Joi.object({
    maxRetries: Joi.number().min(0),
    backoffMs: Joi.number().min(0)
  }).optional()
});

const unsubscribeSchema = Joi.object({
  subscriberId: Joi.string().required(),
  eventName: Joi.string().optional()
});

const eventLogFilterSchema = Joi.object({
  eventName: Joi.string().optional(),
  source: Joi.string().optional(),
  since: Joi.date().optional(),
  until: Joi.date().optional(),
  limit: Joi.number().min(1).max(1000).optional(),
  offset: Joi.number().min(0).optional()
});

module.exports = {
  publishEventSchema,
  subscribeEventSchema,
  unsubscribeSchema,
  eventLogFilterSchema
};

