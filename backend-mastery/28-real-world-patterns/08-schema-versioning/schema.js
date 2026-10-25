const Joi = require('joi');

// Schema version definition
const schemaVersionSchema = Joi.object({
  version: Joi.string()
    .pattern(/^\d+\.\d+\.\d+$/)
    .required()
    .description('Semantic version (e.g., 1.0.0)'),
  
  collection_name: Joi.string()
    .required()
    .description('Collection or table name'),
  
  schema: Joi.object()
    .required()
    .description('Schema definition'),
  
  migration_type: Joi.string()
    .valid('add_field', 'remove_field', 'rename_field', 'change_type', 'breaking')
    .required()
    .description('Type of schema change'),
  
  changes: Joi.object()
    .required()
    .description('Specific changes object'),
  
  description: Joi.string()
    .optional()
    .description('Migration description'),
  
  rollback_supported: Joi.boolean()
    .default(true)
    .description('Whether this migration can be rolled back'),
  
  zero_downtime: Joi.boolean()
    .default(true)
    .description('Whether migration supports zero-downtime')
});

// Create schema version request
const createSchemaVersionSchema = Joi.object({
  version: Joi.string()
    .pattern(/^\d+\.\d+\.\d+$/)
    .required(),
  
  collection_name: Joi.string()
    .required(),
  
  schema: Joi.object()
    .required(),
  
  migration_type: Joi.string()
    .valid('add_field', 'remove_field', 'rename_field', 'change_type', 'breaking')
    .required(),
  
  changes: Joi.object()
    .required(),
  
  description: Joi.string()
    .optional(),
  
  zero_downtime: Joi.boolean()
    .default(true)
});

// Align data to new schema
const alignDataSchema = Joi.object({
  from_version: Joi.string()
    .pattern(/^\d+\.\d+\.\d+$/)
    .required(),
  
  to_version: Joi.string()
    .pattern(/^\d+\.\d+\.\d+$/)
    .required(),
  
  collection_name: Joi.string()
    .required(),
  
  batch_size: Joi.number()
    .integer()
    .min(100)
    .max(10000)
    .default(1000),
  
  dry_run: Joi.boolean()
    .default(false)
});

// Rollback schema version
const rollbackSchemaSchema = Joi.object({
  collection_name: Joi.string()
    .required(),
  
  to_version: Joi.string()
    .pattern(/^\d+\.\d+\.\d+$/)
    .required(),
  
  verify_before_rollback: Joi.boolean()
    .default(true)
});

// Get schema version
const getSchemaVersionSchema = Joi.object({
  collection_name: Joi.string()
    .required(),
  
  version: Joi.string()
    .pattern(/^\d+\.\d+\.\d+$/)
    .optional()
});

// Schema compatibility check
const checkCompatibilitySchema = Joi.object({
  from_version: Joi.string()
    .pattern(/^\d+\.\d+\.\d+$/)
    .required(),
  
  to_version: Joi.string()
    .pattern(/^\d+\.\d+\.\d+$/)
    .required(),
  
  collection_name: Joi.string()
    .required()
});

// Migration history query
const migrationHistorySchema = Joi.object({
  collection_name: Joi.string()
    .required(),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
});

module.exports = {
  schemaVersionSchema,
  createSchemaVersionSchema,
  alignDataSchema,
  rollbackSchemaSchema,
  getSchemaVersionSchema,
  checkCompatibilitySchema,
  migrationHistorySchema
};