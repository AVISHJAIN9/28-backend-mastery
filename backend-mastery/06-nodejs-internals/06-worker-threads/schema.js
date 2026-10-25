/**
 * Worker Threads - Validation Schemas
 */

const Joi = require('joi');

exports.workerTask = Joi.object({
  taskType: Joi.string().valid('fibonacci', 'prime', 'sum').optional(),
  input: Joi.number().integer().min(1).max(1000000).optional(),
  poolSize: Joi.number().integer().min(1).max(16).optional(),
});
