const Joi = require('joi');

const userSchema = Joi.object({
  name: Joi.string().min(1).required(),
  email: Joi.string().email().required()
});

module.exports = { userSchema };

