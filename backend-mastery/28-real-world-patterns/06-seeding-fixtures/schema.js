const Joi = require('joi');

// Schema for seed configuration
const seedConfigSchema = Joi.object({
  environment: Joi.string()
    .valid('development', 'staging', 'production')
    .required()
    .description('Target environment for seeding'),
  
  count: Joi.number()
    .integer()
    .min(1)
    .max(100000)
    .required()
    .description('Number of records to generate'),
  
  includeRelations: Joi.boolean()
    .default(true)
    .description('Include related data (comments, posts, etc)'),
  
  clean_before_seed: Joi.boolean()
    .default(false)
    .description('Delete existing data before seeding'),
  
  locale: Joi.string()
    .allow('en_US', 'fr_FR', 'de_DE', 'es_ES')
    .default('en_US')
    .description('Locale for generated data (names, addresses)')
});

// Schema for running a specific seeder
const runSeederSchema = Joi.object({
  seeder_name: Joi.string()
    .required()
    .description('Name of seeder to run (users, posts, comments)'),
  
  count: Joi.number()
    .integer()
    .min(1)
    .max(100000)
    .required()
    .description('Number of records'),
  
  batch_size: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(100)
    .description('Batch size for bulk insert')
});

// Schema for fixture data
const fixtureDataSchema = Joi.object({
  name: Joi.string()
    .required()
    .description('Fixture name'),
  
  description: Joi.string()
    .description('Fixture description'),
  
  data: Joi.array()
    .items(Joi.object().unknown(true))
    .required()
    .min(1)
    .description('Array of fixture data'),
  
  collection: Joi.string()
    .required()
    .description('Database collection/table name')
});

// Schema for seed validation
const validateSeedSchema = Joi.object({
  seeder_name: Joi.string()
    .required()
    .description('Seeder to validate'),
  
  sample_size: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .description('Number of samples to validate'),
  
  strict: Joi.boolean()
    .default(false)
    .description('Strict validation (fail on first error)')
});

// Schema for seed status query
const seedStatusSchema = Joi.object({
  environment: Joi.string()
    .valid('development', 'staging', 'production')
    .description('Filter by environment'),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .description('Limit results'),
  
  offset: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .description('Pagination offset')
});

// Schema for batch seeding configuration
const batchSeedSchema = Joi.object({
  operations: Joi.array()
    .items(
      Joi.object({
        seeder: Joi.string().required(),
        count: Joi.number().integer().min(1).required(),
        batch_size: Joi.number().integer().min(1).default(100)
      })
    )
    .required()
    .description('Array of seed operations'),
  
  parallel: Joi.boolean()
    .default(false)
    .description('Run seeders in parallel'),
  
  dry_run: Joi.boolean()
    .default(false)
    .description('Preview changes without applying')
});

// Exported validation functions
const seedConfigValidate = (data) => seedConfigSchema.validate(data);
const runSeederValidate = (data) => runSeederSchema.validate(data);
const fixtureDataValidate = (data) => fixtureDataSchema.validate(data);
const validateSeedValidate = (data) => validateSeedSchema.validate(data);
const seedStatusValidate = (data) => seedStatusSchema.validate(data);
const batchSeedValidate = (data) => batchSeedSchema.validate(data);

module.exports = {
  seedConfigSchema,
  runSeederSchema,
  fixtureDataSchema,
  validateSeedSchema,
  seedStatusSchema,
  batchSeedSchema,
  seedConfigValidate,
  runSeederValidate,
  fixtureDataValidate,
  validateSeedValidate,
  seedStatusValidate,
  batchSeedValidate
};
