const Joi = require('joi');

// Schema for seed file configuration
const seedFileSchema = Joi.object({
  name: Joi.string()
    .required()
    .description('Seed file name'),
  
  version: Joi.string()
    .required()
    .description('Seed version (1.0.0)'),
  
  environment: Joi.string()
    .valid('development', 'staging', 'production')
    .required()
    .description('Target environment'),
  
  collections: Joi.object()
    .required()
    .description('Collections and data to seed'),
  
  force: Joi.boolean()
    .default(false)
    .description('Force seed even if exists'),
  
  rollback_on_error: Joi.boolean()
    .default(true)
    .description('Rollback if seeding fails')
});

// Schema for running seed
const runSeedSchema = Joi.object({
  seed_file: Joi.string()
    .required()
    .description('Path to seed file'),
  
  environment: Joi.string()
    .valid('development', 'staging', 'production')
    .required(),
  
  dry_run: Joi.boolean()
    .default(false)
    .description('Preview without applying')
});

// Schema for rollback request
const rollbackSchema = Joi.object({
  version: Joi.string()
    .required()
    .description('Version to rollback to'),
  
  environment: Joi.string()
    .valid('development', 'staging', 'production')
    .required()
});

// Schema for seed history query
const historySchema = Joi.object({
  environment: Joi.string()
    .valid('development', 'staging', 'production'),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10),
  
  offset: Joi.number()
    .integer()
    .min(0)
    .default(0)
});

// Schema for migration status
const migrationStatusSchema = Joi.object({
  environment: Joi.string()
    .valid('development', 'staging', 'production'),
  
  collection: Joi.string()
});

module.exports = {
  seedFileSchema,
  runSeedSchema,
  rollbackSchema,
  historySchema,
  migrationStatusSchema
};
