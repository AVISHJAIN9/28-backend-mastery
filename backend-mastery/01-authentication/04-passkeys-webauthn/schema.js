const Joi = require('joi');

exports.startRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(100).required()
}).unknown(false);

exports.completeRegistrationSchema = Joi.object({
  userId: Joi.string().required(),
  credential: Joi.object({
    id: Joi.string().required(),
    publicKey: Joi.string().required(),
    counter: Joi.number().optional()
  }).required()
}).unknown(false);

exports.startAuthSchema = Joi.object({
  email: Joi.string().email().required()
}).unknown(false);

exports.completeAuthSchema = Joi.object({
  challengeId: Joi.string().required(),
  credentialId: Joi.string().required(),
  signature: Joi.string().required()
}).unknown(false);

