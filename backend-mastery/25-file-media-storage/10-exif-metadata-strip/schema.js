const Joi = require('joi');

const exifSchema = Joi.object({
  file: Joi.any().required()
});

const exifOptions = {
  removeExif: Joi.boolean().default(true),
  preserveIfRequired: Joi.boolean().default(false)
};

module.exports = { exifSchema, exifOptions };
