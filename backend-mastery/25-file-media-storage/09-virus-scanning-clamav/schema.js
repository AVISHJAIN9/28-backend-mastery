const Joi = require('joi');

const fileUploadSchema = Joi.object({
  file: Joi.any().required()
});

const scanResultSchema = {
  success: Joi.boolean().required(),
  fileName: Joi.string().required(),
  result: Joi.string().valid('clean', 'infected').required()
};

module.exports = { fileUploadSchema, scanResultSchema };
