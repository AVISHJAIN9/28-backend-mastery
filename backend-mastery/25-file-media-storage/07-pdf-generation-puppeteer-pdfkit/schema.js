const Joi = require('joi');

const pdfTemplateSchema = Joi.object({
  title: Joi.string().max(200).required(),
  content: Joi.string().max(5000).required(),
  author: Joi.string().max(100).optional()
});

const invoiceSchema = Joi.object({
  invoiceNumber: Joi.string().max(50).required(),
  items: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    price: Joi.number().required()
  })).required(),
  total: Joi.number().required()
});

module.exports = { pdfTemplateSchema, invoiceSchema };
