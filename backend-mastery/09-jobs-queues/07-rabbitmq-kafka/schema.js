const Joi = require('joi');

const publishMessageSchema = Joi.object({
  broker: Joi.string().valid('rabbitmq', 'kafka').required(),
  exchange: Joi.string().when('broker', {
    is: 'rabbitmq',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  topic: Joi.string().when('broker', {
    is: 'kafka',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  routingKey: Joi.string().optional(),
  message: Joi.object().required(),
  priority: Joi.number().min(0).max(10).optional(),
  ttl: Joi.number().optional()
});

const consumeMessageSchema = Joi.object({
  broker: Joi.string().valid('rabbitmq', 'kafka').required(),
  queue: Joi.string().when('broker', {
    is: 'rabbitmq',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  topic: Joi.string().when('broker', {
    is: 'kafka',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  groupId: Joi.string().optional(),
  limit: Joi.number().min(1).max(100).optional()
});

const configSchema = Joi.object({
  broker: Joi.string().valid('rabbitmq', 'kafka').required()
});

module.exports = {
  publishMessageSchema,
  consumeMessageSchema,
  configSchema
};

