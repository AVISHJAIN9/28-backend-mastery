const Joi = require('joi');

// Seed data schema
const seedDataSchema = Joi.object({
  seedVersion: Joi.number().integer().min(1).default(1),
  force: Joi.boolean().default(false)
});

// User record schema
const userRecordSchema = Joi.object({
  idempotencyKey: Joi.string().required(),
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid('user', 'admin').default('user'),
  seedVersion: Joi.number().integer().min(1)
});

// Product record schema
const productRecordSchema = Joi.object({
  idempotencyKey: Joi.string().required(),
  name: Joi.string().min(2).max(100).required(),
  price: Joi.number().positive().required(),
  stock: Joi.number().integer().min(0).required(),
  seedVersion: Joi.number().integer().min(1)
});

// Upsert records schema
const upsertRecordsSchema = Joi.object({
  records: Joi.array()
    .items(Joi.alternatives().try(userRecordSchema, productRecordSchema))
    .required(),
  type: Joi.string().valid('users', 'products').default('users')
});

// Query schema
const querySchema = Joi.object({
  type: Joi.string().valid('users', 'products', 'all').default('users')
});

module.exports = {
  seedDataSchema,
  userRecordSchema,
  productRecordSchema,
  upsertRecordsSchema,
  querySchema
};
