const Joi = require('joi');
const ephemeralSchema = Joi.object({
  content: Joi.string().required(),
  ttl: Joi.number().required().max(3600),
  readReceipt: Joi.boolean().default(false)
});
module.exports = { ephemeralSchema };