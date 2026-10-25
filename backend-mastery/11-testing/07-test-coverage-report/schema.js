const Joi = require('joi');

const mathSchema = Joi.object({
  a: Joi.number().required(),
  b: Joi.number().required()
});

module.exports = { mathSchema };

