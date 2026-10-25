/**
 * Cluster Module - Validation Schemas
 */

const Joi = require('joi');

exports.clusterConfig = Joi.object({
  workers: Joi.number().integer().min(1).max(64).optional(),
  taskDuration: Joi.number().integer().min(100).max(10000).optional(),
});
