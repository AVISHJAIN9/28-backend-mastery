const Joi = require('joi');

const eventSchema = Joi.object({
  event: Joi.string().required(),
  properties: Joi.object().unknown(),
  timestamp: Joi.date(),
});

const userSchema = Joi.object({
  userId: Joi.string().required(),
  properties: Joi.object().unknown(),
});

const featureFlagSchema = Joi.object({
  key: Joi.string().required(),
  userId: Joi.string(),
});

const cohortSchema = Joi.object({
  name: Joi.string().required(),
  filters: Joi.object().unknown(),
});

module.exports = {
  eventSchema,
  userSchema,
  featureFlagSchema,
  cohortSchema,
};
