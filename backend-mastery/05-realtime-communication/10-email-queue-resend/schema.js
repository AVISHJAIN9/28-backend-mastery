const Joi = require('joi');
const emailSchema = Joi.object({
  to: Joi.string().email().required(),
  subject: Joi.string().required(),
  html: Joi.string().required(),
  from: Joi.string().email().optional()
});
module.exports = { emailSchema };