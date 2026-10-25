const Joi = require('joi');

const schemas = {
  create: Joi.object({
    name: Joi.string().required(),
    price: Joi.number().positive().required(),
    description: Joi.string().optional(),
    category: Joi.string().optional()
  }),

  update: Joi.object({
    name: Joi.string().optional(),
    price: Joi.number().positive().optional(),
    description: Joi.string().optional(),
    category: Joi.string().optional()
  }),

  bulkDelete: Joi.object({
    ids: Joi.array().items(Joi.string().uuid()).required()
  })
};

module.exports = schemas;
