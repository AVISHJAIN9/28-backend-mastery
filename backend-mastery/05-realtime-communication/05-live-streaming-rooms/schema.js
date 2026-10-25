const Joi = require('joi');
const roomSchema = Joi.object({
  roomId: Joi.string().required(),
  name: Joi.string().required(),
  isPrivate: Joi.boolean().default(false)
});
module.exports = { roomSchema };