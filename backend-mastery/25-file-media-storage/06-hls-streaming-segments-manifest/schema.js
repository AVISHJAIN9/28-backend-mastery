const Joi = require('joi');

const createStreamSchema = Joi.object({
  name: Joi.string().max(100).optional()
});

const segmentSchema = Joi.object({
  streamId: Joi.string().hex().optional(),
  duration: Joi.number().default(10)
});

module.exports = { createStreamSchema, segmentSchema };
