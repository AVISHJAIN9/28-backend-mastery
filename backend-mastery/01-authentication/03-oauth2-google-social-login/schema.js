const Joi = require('joi');

exports.linkProviderSchema = Joi.object({
  code: Joi.string().required(),
  state: Joi.string().required(),
  provider: Joi.string().valid('google', 'github', 'facebook').required()
}).unknown(false);

