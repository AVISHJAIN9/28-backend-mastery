const Joi = require('joi');

const schemas = {
  generateJWT: Joi.object({
    userId: Joi.string().required(),
    email: Joi.string().email().required(),
    role: Joi.string().optional()
  }),

  refreshJWT: Joi.object({
    refreshToken: Joi.string().required()
  })
};

module.exports = schemas;
