/**
 * Buffers and Streams - Validation Schemas
 */

const Joi = require('joi');

// Validation for buffer operations
exports.bufferOps = Joi.object({
  size: Joi.number().integer().min(1).max(1048576).optional(),
  encoding: Joi.string().valid('utf8', 'hex', 'base64', 'ascii').optional(),
});

// Validation for stream operations
exports.streamOps = Joi.object({
  chunkSize: Joi.number().integer().min(64).max(1048576).optional(),
  highWaterMark: Joi.number().integer().min(16).max(1048576).optional(),
});

// Validation for file operations
exports.fileOps = Joi.object({
  filename: Joi.string().max(255).optional(),
  lines: Joi.number().integer().min(1).max(100000).optional(),
});
