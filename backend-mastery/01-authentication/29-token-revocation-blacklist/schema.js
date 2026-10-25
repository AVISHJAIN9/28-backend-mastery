const Joi = require('joi');

exports.revokeSchema = Joi.object({
  token: Joi.string().required(),
  reason: Joi.string().optional()
});
