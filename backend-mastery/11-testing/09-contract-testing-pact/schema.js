const Joi = require('joi');

const userSchema = Joi.object({
  id: Joi.string().optional(),
  name: Joi.string().required(),
  email: Joi.string().email().required()
});

const createUserSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required()
});

module.exports = { userSchema, createUserSchema };

