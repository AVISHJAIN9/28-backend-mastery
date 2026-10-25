const Joi = require('joi');

exports.authSchema = Joi.object({
  email: Joi.string().email().optional(),
  password: Joi.string().min(8).optional(),
  token: Joi.string().optional()
});
