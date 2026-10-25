const Joi = require('joi');

const mathSchema = Joi.object({
  a: Joi.number().required(),
  b: Joi.number().required()
});

const scoreSchema = Joi.object({
  score: Joi.number().min(0).max(100).required()
});

module.exports = { mathSchema, scoreSchema };

