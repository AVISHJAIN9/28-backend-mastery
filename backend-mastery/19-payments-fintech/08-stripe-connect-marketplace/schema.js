const Joi = require('joi');

exports.sellerSchema = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().min(2).required(),
  lastName: Joi.string().min(2).required(),
  businessName: Joi.string().min(3).required()
});

exports.chargeSchema = Joi.object({
  amount: Joi.number().positive().required(),
  sellerId: Joi.string().required(),
  customerId: Joi.string().required(),
  description: Joi.string().required()
});

module.exports = exports;
