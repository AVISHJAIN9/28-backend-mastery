const Joi = require('joi');

const itemSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email(),
  status: Joi.string().valid('active', 'inactive')
});

module.exports = { itemSchema };