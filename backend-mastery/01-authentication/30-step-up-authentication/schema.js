const Joi = require('joi');

exports.initiateSchema = Joi.object({
  operation: Joi.string()
    .valid(
      'change_password',
      'delete_account',
      'modify_payment',
      'change_email',
      'enable_2fa',
      'disable_2fa'
    )
    .required(),
  details: Joi.object().optional()
});

exports.verifySchema = Joi.object({
  sessionId: Joi.string().required(),
  password: Joi.string().min(6).required(),
  mfaCode: Joi.string().optional()
});

exports.performSchema = Joi.object({
  operation: Joi.string().required(),
  data: Joi.object().optional()
});
