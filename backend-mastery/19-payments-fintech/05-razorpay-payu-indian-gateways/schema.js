const Joi = require('joi');

exports.razorpayOrderSchema = Joi.object({
  amount: Joi.number().positive().max(10000000).required(),
  currency: Joi.string().valid('INR', 'USD').default('INR'),
  description: Joi.string().min(3).required()
});

exports.payuPaymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?\d{10,}$/).required(),
  name: Joi.string().min(2).required()
});

module.exports = exports;
