const Joi = require('joi');

const schemas = {
  evaluateRisk: Joi.object({
    username: Joi.string().alphanum().required(),
    ip: Joi.string().ip().required(),
    userAgent: Joi.string().optional(),
    deviceId: Joi.string().optional()
  }),

  authenticate: Joi.object({
    username: Joi.string().alphanum().required(),
    password: Joi.string().min(6).required(),
    ip: Joi.string().ip().required(),
    userAgent: Joi.string().optional(),
    deviceId: Joi.string().optional()
  }),

  completeChallenge: Joi.object({
    challengeId: Joi.string().uuid().required(),
    username: Joi.string().alphanum().required(),
    mfaCode: Joi.string().length(6).optional()
  }),

  trustDevice: Joi.object({
    userId: Joi.string().required(),
    deviceId: Joi.string().required()
  })
};

module.exports = schemas;
