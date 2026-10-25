const Joi = require('joi');

// Update product schema (with version for optimistic locking)
const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  price: Joi.number().positive(),
  description: Joi.string().max(500),
  currentVersion: Joi.number().integer().min(0).required()  // Client's current version
});

// Create product schema
const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  price: Joi.number().positive().required(),
  description: Joi.string().max(500),
  category: Joi.string().max(50)
});

// Query parameters
const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

// ID parameter
const idSchema = Joi.object({
  id: Joi.number().integer().required()
});

// Concurrent update test schema
const concurrentUpdateSchema = Joi.object({
  id: Joi.number().integer().required(),
  updates: Joi.array().items(
    Joi.object({
      name: Joi.string().max(100),
      price: Joi.number().positive(),
      currentVersion: Joi.number().integer().required()
    })
  ).min(1).required()
});

module.exports = {
  updateProductSchema,
  createProductSchema,
  querySchema,
  idSchema,
  concurrentUpdateSchema
};

