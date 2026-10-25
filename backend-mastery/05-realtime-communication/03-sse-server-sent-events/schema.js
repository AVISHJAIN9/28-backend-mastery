const Joi = require('joi');
const sseEventSchema = Joi.object({
  eventType: Joi.string().required(),
  data: Joi.any().required(),
  userId: Joi.string().optional()
});
module.exports = { sseEventSchema };