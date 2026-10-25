const Joi = require('joi');

const smsSchema = Joi.object({
  phoneNumber: Joi.string().required(),
  message: Joi.string().max(160).required(),
});

const otpSchema = Joi.object({
  phoneNumber: Joi.string().required(),
  length: Joi.number().min(4).max(8).default(6),
});

const verifyOtpSchema = Joi.object({
  phoneNumber: Joi.string().required(),
  code: Joi.string().required(),
});

const callSchema = Joi.object({
  phoneNumber: Joi.string().required(),
  message: Joi.string().required(),
});

module.exports = {
  smsSchema,
  otpSchema,
  verifyOtpSchema,
  callSchema,
};
