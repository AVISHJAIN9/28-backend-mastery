/**
 * Event Loop - Validation Schemas
 */

const Joi = require('joi');

// Validation schema for event loop phase demonstration
exports.phaseDemo = Joi.object({
  phase: Joi.string()
    .valid('timers', 'pending', 'poll', 'check', 'close')
    .optional(),
  duration: Joi.number().integer().min(0).max(10000).optional(),
  iterations: Joi.number().integer().min(1).max(1000).optional(),
});

// Validation for lag detection parameters
exports.lagDetection = Joi.object({
  duration: Joi.number().integer().min(100).max(5000).required(),
  samples: Joi.number().integer().min(1).max(100).optional(),
});

// Validation for execution order demonstration
exports.executionOrder = Joi.object({
  includePromises: Joi.boolean().optional(),
  includeNextTick: Joi.boolean().optional(),
  includeSetTimeout: Joi.boolean().optional(),
  includeSetImmediate: Joi.boolean().optional(),
});

// Validation for metrics query
exports.metricsQuery = Joi.object({
  detailed: Joi.boolean().optional(),
  reset: Joi.boolean().optional(),
});

