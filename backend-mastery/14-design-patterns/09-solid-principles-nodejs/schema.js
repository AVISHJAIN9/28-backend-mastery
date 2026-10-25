
const Joi = require('joi');

const itemSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500),
  value: Joi.string().max(100),
  status: Joi.string().valid('active', 'inactive')
}).unknown(true);

const validateInputData = (data) => {
  return itemSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
};

module.exports = {
  itemSchema,
  validateInputData
};
