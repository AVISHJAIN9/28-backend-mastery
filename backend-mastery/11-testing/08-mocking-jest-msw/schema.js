const Joi = require('joi');

const userSchema = Joi.object({
  id: Joi.number().optional(),
  name: Joi.string().max(100).required(),
  email: Joi.string().email().required()
});

module.exports = { userSchema };

