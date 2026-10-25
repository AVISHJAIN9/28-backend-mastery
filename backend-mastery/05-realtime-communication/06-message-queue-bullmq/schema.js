const Joi = require('joi');
const jobSchema = Joi.object({
  type: Joi.string().required(),
  data: Joi.object().required(),
  priority: Joi.number().default(0),
  attempts: Joi.number().default(3),
  delay: Joi.number().default(0)
});
module.exports = { jobSchema };