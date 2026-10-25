const Joi = require('joi');

exports.cardTokenizationSchema = Joi.object({
  cardNumber: Joi.string().regex(/^\d{13,19}$/).required(),
  expiry: Joi.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/).required(),
  name: Joi.string().min(2).max(100).required()
});

exports.paymentSchema = Joi.object({
  token: Joi.string().pattern(/^tok_/).required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).uppercase().required(),
  description: Joi.string().max(500)
});

module.exports = exports;
