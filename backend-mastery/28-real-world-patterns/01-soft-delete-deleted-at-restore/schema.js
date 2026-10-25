const Joi = require('joi');

// User creation schema
const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid('user', 'admin').default('user')
});

// User update schema
const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  role: Joi.string().valid('user', 'admin')
}).min(1);

// Query parameters for filtering
const querySchema = Joi.object({
  includeDeleted: Joi.boolean().default(false),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

// ID parameter schema
const idSchema = Joi.object({
  id: Joi.number().integer().required()
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  querySchema,
  idSchema
};

