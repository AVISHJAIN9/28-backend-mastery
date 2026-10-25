const Joi = require('joi');

const killSchema = Joi.object({
  service_name: Joi.string().required()
});

const latencySchema = Joi.object({
  service_name: Joi.string().required(),
  latency_ms: Joi.number().min(0).required()
});

module.exports = { killSchema, latencySchema };
