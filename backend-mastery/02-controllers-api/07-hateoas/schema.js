const Joi = require('joi');

const schemas = {
  createResource: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000).optional()
  }),

  updateResource: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    description: Joi.string().max(1000).optional()
  }).min(1),

  pagination: Joi.object({
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).max(100).optional()
  })
};

module.exports = schemas;
