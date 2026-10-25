const Joi = require('joi');
const notifSchema = Joi.object({
  title: Joi.string().required(),
  body: Joi.string().required(),
  icon: Joi.string().optional(),
  data: Joi.object().optional()
});
module.exports = { notifSchema };