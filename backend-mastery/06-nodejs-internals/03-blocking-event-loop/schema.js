/**
 * Blocking Event Loop - Validation Schemas
 */

const Joi = require('joi');

// Validation for CPU-intensive operation
exports.cpuIntensive = Joi.object({
  iterations: Joi.number().integer().min(1).max(1000000000).optional(),
  blockDuration: Joi.number().integer().min(1).max(10000).optional(),
});

// Validation for non-blocking approach
exports.nonBlocking = Joi.object({
  chunkSize: Joi.number().integer().min(1).max(1000).optional(),
  delay: Joi.number().integer().min(0).max(100).optional(),
});

// Validation for monitoring parameters
exports.monitoring = Joi.object({
  duration: Joi.number().integer().min(100).max(60000).optional(),
});
