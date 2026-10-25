const Joi = require('joi');

const asyncSchema = Joi.object({
  ids: Joi.array().items(Joi.number())
});

module.exports = { asyncSchema };

