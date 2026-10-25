const Joi = require('joi');

const transcodeSchema = Joi.object({
  format: Joi.string().valid('h264', 'vp9', 'av1').required(),
  bitrate: Joi.string().regex(/^\d+k$/).required(),
  resolution: Joi.string().regex(/^\d+x\d+$/).required()
});

const statusSchema = Joi.object({
  transcodeId: Joi.string().hex().length(16).required()
});

module.exports = { transcodeSchema, statusSchema };
