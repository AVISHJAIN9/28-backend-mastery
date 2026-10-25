const Joi = require('joi');

exports.sendLinkSchema = Joi.object({
  email: Joi.string().email().required()
}).unknown(false);

exports.verifyTokenSchema = Joi.object({
  token: Joi.string().required()
}).unknown(false);

exports.registerSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(100).required()
}).unknown(false);

