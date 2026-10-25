// Schema validation using Joi
const Joi = require('joi');

const schemas = {
  // Item schema for CRUD operations
  item: Joi.object({
    name: Joi.string().max(100).required(),
    description: Joi.string().max(500),
    value: Joi.number(),
    createdAt: Joi.date(),
    updatedAt: Joi.date()
  }),

  // ID validation
  id: Joi.number().integer().positive().required(),

  // Query parameters
  query: Joi.object({
    limit: Joi.number().integer().positive().max(100),
    offset: Joi.number().integer().non-negative(),
    sort: Joi.string(),
    filter: Joi.string()
  })
};

module.exports = schemas;
