const Joi = require('joi');

// ==================== User Registration Schema ====================
const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  displayName: Joi.string().max(255),
  photoURL: Joi.string().uri(),
});

// ==================== User Login Schema ====================
const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// ==================== File Upload Schema ====================
const fileUploadSchema = Joi.object({
  fileName: Joi.string().required(),
  fileSize: Joi.number().positive(),
  contentType: Joi.string(),
  metadata: Joi.object().unknown(),
});

// ==================== Profile Update Schema ====================
const profileUpdateSchema = Joi.object({
  displayName: Joi.string().max(255),
  photoURL: Joi.string().uri(),
  phoneNumber: Joi.string(),
  metadata: Joi.object().unknown(),
});

// ==================== Document Schema ====================
const documentSchema = Joi.object({
  title: Joi.string().max(500).required(),
  content: Joi.string().required(),
  docType: Joi.string().valid('note', 'document', 'file'),
  tags: Joi.array().items(Joi.string()),
  public: Joi.boolean().default(false),
  metadata: Joi.object().unknown(),
});

module.exports = {
  userRegistrationSchema,
  userLoginSchema,
  fileUploadSchema,
  profileUpdateSchema,
  documentSchema,
};
