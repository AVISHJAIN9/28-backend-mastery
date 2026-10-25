const Joi = require('joi');

exports.refundSchema = Joi.object({
  chargeId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  reason: Joi.string().required()
});

exports.chargebackSchema = Joi.object({
  chargeId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  reason: Joi.string().valid('fraud', 'service_not_received', 'quality_issue', 'billing_error').required()
});

module.exports = exports;
