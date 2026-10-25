const Joi = require('joi');
const pollSchema = Joi.object({
  question: Joi.string().required(),
  options: Joi.array().items(Joi.string()).min(2).required(),
  expiresAt: Joi.date().optional()
});
module.exports = { pollSchema };