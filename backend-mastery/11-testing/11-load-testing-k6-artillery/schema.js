const Joi = require('joi');

const userSchema = Joi.object({
  id: Joi.number().optional(),
  name: Joi.string().min(1).required(),
  email: Joi.string().email().required(),
  createdAt: Joi.date().optional()
});

module.exports = { userSchema };

