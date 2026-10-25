const Joi = require('joi');

const PLANS = ['starter', 'professional', 'enterprise'];

exports.subscriptionSchema = Joi.object({
  planId: Joi.string().valid(...PLANS).required(),
  customerId: Joi.string().required()
});

exports.planChangeSchema = Joi.object({
  newPlanId: Joi.string().valid(...PLANS).required()
});

module.exports = exports;
