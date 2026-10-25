const Joi = require('joi');

exports.createPaymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).uppercase().required(),
  customerId: Joi.string().alphanum().required()
});

exports.validatePaymentInput = (data) => {
  return exports.createPaymentSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
};

module.exports = exports;
