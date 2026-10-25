const Joi = require('joi');

const fileValidationSchema = Joi.object({
  file: Joi.any().required()
});

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/zip'
];

module.exports = { fileValidationSchema, allowedMimeTypes };
