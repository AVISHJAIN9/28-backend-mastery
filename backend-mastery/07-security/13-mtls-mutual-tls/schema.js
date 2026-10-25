/**
 * Schema - Joi Validation Schemas
 */

const joi = require('joi');

// Basic example schema
const demoSchema = joi.object({
  id: joi.number().required(),
  name: joi.string().max(100).required()
});

module.exports = {
  demoSchema
};
