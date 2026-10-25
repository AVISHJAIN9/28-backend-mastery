const Joi = require('joi');
const tokenSchema = Joi.object({
  token: Joi.string().required(),
  refreshToken: Joi.string().optional()
});
module.exports = { tokenSchema };