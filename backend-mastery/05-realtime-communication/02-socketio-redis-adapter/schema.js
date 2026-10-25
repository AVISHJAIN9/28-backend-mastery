// Redis Adapter Schema - Distributed Socket.io validation

const Joi = require('joi');

const redisConfigSchema = Joi.object({
  host: Joi.string().hostname().default('localhost'),
  port: Joi.number().port().default(6379),
  password: Joi.string().optional().allow(''),
  db: Joi.number().min(0).max(15).default(0),
  retryStrategy: Joi.function().optional(),
  maxRetriesPerRequest: Joi.number().default(3),
  enableReadyCheck: Joi.boolean().default(true)
});

const messageSchema = Joi.object({
  content: Joi.string().required().max(5000),
  userId: Joi.string().required(),
  serverId: Joi.string().required(),
  timestamp: Joi.date().default(() => new Date()),
  channel: Joi.string().optional().default('broadcast')
});

const presenceSchema = Joi.object({
  userId: Joi.string().required(),
  username: Joi.string().required(),
  serverId: Joi.string().required(),
  socketId: Joi.string().required(),
  status: Joi.string().valid('online', 'away', 'offline').default('online')
});

const adapterMetricsSchema = Joi.object({
  serverCount: Joi.number().required(),
  totalConnections: Joi.number().required(),
  totalSockets: Joi.number().required(),
  redisLatency: Joi.number().optional()
});

module.exports = {
  redisConfigSchema,
  messageSchema,
  presenceSchema,
  adapterMetricsSchema
};

