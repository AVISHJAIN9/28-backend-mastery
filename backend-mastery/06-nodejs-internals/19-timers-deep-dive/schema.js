const Joi = require('joi');

const timerSchema = Joi.object({
  delay: Joi.number().min(0).max(60000),
  count: Joi.number().min(1).max(10000),
});

module.exports = {
  timerSchema,
};
