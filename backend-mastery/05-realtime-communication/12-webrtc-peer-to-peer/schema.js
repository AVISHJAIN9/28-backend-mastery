const Joi = require('joi');
const sdpSchema = Joi.object({
  type: Joi.string().valid('offer', 'answer'),
  sdp: Joi.string().required()
});
const candidateSchema = Joi.object({
  candidate: Joi.string().optional(),
  sdpMLineIndex: Joi.number().required(),
  sdpMid: Joi.string().required()
});
module.exports = { sdpSchema, candidateSchema };