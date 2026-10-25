/**
 * Memory Leaks Patterns - Validation Schemas
 */

const Joi = require('joi');

exports.memoryTest = Joi.object({
  pattern: Joi.string().valid('closure', 'event-listener', 'timer', 'circular').optional(),
  iterations: Joi.number().integer().min(1).max(100000).optional(),
});
