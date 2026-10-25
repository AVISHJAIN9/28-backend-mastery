const Joi = require('joi');

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const databaseSchema = Joi.object({
  table: Joi.string().required(),
  data: Joi.object().unknown().required(),
});

const storageSchema = Joi.object({
  bucket: Joi.string().required(),
  fileName: Joi.string().required(),
});

const realtimeSchema = Joi.object({
  channel: Joi.string().required(),
  event: Joi.string().required(),
  payload: Joi.object().unknown(),
});

module.exports = {
  userSchema,
  databaseSchema,
  storageSchema,
  realtimeSchema,
};
