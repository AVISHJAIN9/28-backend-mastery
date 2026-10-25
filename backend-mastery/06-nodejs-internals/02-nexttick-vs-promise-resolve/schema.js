/**
 * process.nextTick vs Promise.resolve - Validation Schemas
 */

const Joi = require('joi');

// Validation schema for microtask demonstration
exports.microtaskDemo = Joi.object({
  includeNextTick: Joi.boolean().optional(),
  includePromise: Joi.boolean().optional(),
  includeSetTimeout: Joi.boolean().optional(),
  iterations: Joi.number().integer().min(1).max(100).optional(),
});

// Validation for execution order test
exports.executionOrderTest = Joi.object({
  testType: Joi.string().valid('mixed', 'nested', 'queued').optional(),
});

// Validation for microtask queue analysis
exports.microtaskAnalysis = Joi.object({
  depth: Joi.number().integer().min(1).max(10).optional(),
});
