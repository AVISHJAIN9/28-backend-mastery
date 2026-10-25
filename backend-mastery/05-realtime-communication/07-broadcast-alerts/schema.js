const Joi = require('joi');
const alertSchema = Joi.object({
  title: Joi.string().required(),
  message: Joi.string().required(),
  severity: Joi.string().valid('info', 'warning', 'error', 'critical'),
  targetUsers: Joi.array().items(Joi.string()).optional()
});
module.exports = { alertSchema };