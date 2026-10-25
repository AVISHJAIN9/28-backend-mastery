const Joi = require('joi');

const userSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  createdAt: Joi.date().optional(),
  version: Joi.number().optional()
});

module.exports = { userSchema };

