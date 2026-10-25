const Joi = require('joi');

// Process transaction schema
const processTransactionSchema = Joi.object({
  account_id: Joi.string().required(),
  amount: Joi.number().positive().required(),
  type: Joi.string().valid('deposit', 'withdrawal').required(),
  description: Joi.string().max(200)
});

// Batch payment schema
const batchPaymentSchema = Joi.object({
  job_id: Joi.string().required(),
  payments: Joi.array().items(
    Joi.object({
      recipient_id: Joi.string().required(),
      amount: Joi.number().positive().required()
    })
  ).min(1).required(),
  lock_ttl: Joi.number().integer().min(1000).max(30000).default(10000)
});

// Resource allocation schema
const allocateResourceSchema = Joi.object({
  resource_id: Joi.string().required(),
  worker_id: Joi.string().required(),
  duration: Joi.number().integer().min(1).max(60).default(5)
});

// Query parameters
const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

// ID parameter
const idSchema = Joi.object({
  id: Joi.string().required()
});

module.exports = {
  processTransactionSchema,
  batchPaymentSchema,
  allocateResourceSchema,
  querySchema,
  idSchema
};

