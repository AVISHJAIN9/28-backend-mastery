const Joi = require('joi');
const drawSchema = Joi.object({
  type: Joi.string().valid('line', 'circle', 'rect', 'text').required(),
  startX: Joi.number().required(),
  startY: Joi.number().required(),
  endX: Joi.number().required(),
  endY: Joi.number().required(),
  color: Joi.string().default('#000000'),
  strokeWidth: Joi.number().default(2)
});
module.exports = { drawSchema };