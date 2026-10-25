const Joi = require('joi');
const operationSchema = Joi.object({
  type: Joi.string().valid('insert', 'delete').required(),
  position: Joi.number().required(),
  content: Joi.string().optional(),
  timestamp: Joi.date().required(),
  userId: Joi.string().required()
});
module.exports = { operationSchema };