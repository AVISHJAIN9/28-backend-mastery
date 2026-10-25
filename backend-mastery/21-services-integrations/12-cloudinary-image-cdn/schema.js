const Joi = require('joi');

const uploadSchema = Joi.object({
  imagePath: Joi.string().required(),
  publicId: Joi.string(),
  folder: Joi.string(),
});

const transformSchema = Joi.object({
  publicId: Joi.string().required(),
  width: Joi.number(),
  height: Joi.number(),
  crop: Joi.string().valid('fill', 'fit', 'crop', 'thumb'),
  quality: Joi.string().default('auto'),
  format: Joi.string().default('auto'),
});

const deleteSchema = Joi.object({
  publicId: Joi.string().required(),
});

const listSchema = Joi.object({
  prefix: Joi.string(),
});

module.exports = {
  uploadSchema,
  transformSchema,
  deleteSchema,
  listSchema,
};
