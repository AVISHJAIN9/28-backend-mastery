const Joi = require('joi');

const bucketSchema = Joi.object({
  bucketName: Joi.string().required(),
});

const uploadSchema = Joi.object({
  bucketName: Joi.string().required(),
  fileName: Joi.string().required(),
  contentType: Joi.string(),
  expiresIn: Joi.number().default(3600),
});

const downloadSchema = Joi.object({
  bucketName: Joi.string().required(),
  fileName: Joi.string().required(),
  expiresIn: Joi.number().default(3600),
});

const listSchema = Joi.object({
  bucketName: Joi.string().required(),
});

const deleteSchema = Joi.object({
  bucketName: Joi.string().required(),
  fileName: Joi.string().required(),
});

module.exports = {
  bucketSchema,
  uploadSchema,
  downloadSchema,
  listSchema,
  deleteSchema,
};
