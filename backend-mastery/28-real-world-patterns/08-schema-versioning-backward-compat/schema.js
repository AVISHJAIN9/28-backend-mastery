const Joi = require('joi');

// Record creation schema (flexible to support multiple versions)
const createRecordSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().allow(null).optional(),
  avatar: Joi.string().uri().allow(null).optional(),
  __schema: Joi.number().integer().min(1).optional()
});

// Record update schema
const updateRecordSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().allow(null).optional(),
  avatar: Joi.string().uri().allow(null).optional()
}).min(1);

// Schema migration request
const migrateSchemaSchema = Joi.object({
  targetVersion: Joi.number().integer().min(1).required()
});

// ID validation
const idSchema = Joi.object({
  id: Joi.number().integer().required()
});

// Query parameters
const querySchema = Joi.object({
  targetVersion: Joi.number().integer().min(1).optional()
});

module.exports = {
  createRecordSchema,
  updateRecordSchema,
  migrateSchemaSchema,
  idSchema,
  querySchema
};
