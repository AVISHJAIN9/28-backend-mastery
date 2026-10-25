const Joi = require('joi');

// ==================== Email Schema ====================
const emailSchema = Joi.object({
  to: Joi.string().email().required(),
  subject: Joi.string().max(500).required(),
  body: Joi.string().required(),
  html: Joi.string(),
});

// ==================== Verification Email Schema ====================
const verificationEmailSchema = Joi.object({
  to: Joi.string().email().required(),
  verificationCode: Joi.string().required(),
});

// ==================== Receipt Email Schema ====================
const receiptEmailSchema = Joi.object({
  to: Joi.string().email().required(),
  orderId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  items: Joi.array().items(Joi.object({
    name: Joi.string(),
    quantity: Joi.number(),
    price: Joi.number(),
  })),
});

// ==================== Batch Email Schema ====================
const batchEmailSchema = Joi.object({
  recipients: Joi.array().items(Joi.string().email()).required(),
  subject: Joi.string().max(500).required(),
  body: Joi.string().required(),
});

// ==================== Email Template Schema ====================
const emailTemplateSchema = Joi.object({
  name: Joi.string().max(100).required(),
  subject: Joi.string().max(500).required(),
  body: Joi.string().required(),
  html: Joi.string(),
  variables: Joi.array().items(Joi.string()),
});

module.exports = {
  emailSchema,
  verificationEmailSchema,
  receiptEmailSchema,
  batchEmailSchema,
  emailTemplateSchema,
};
