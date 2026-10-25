const Joi = require('joi');

const orderSchema = Joi.object({
  orderId: Joi.string().required(),
  customerId: Joi.string().required(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().min(1).required(),
      price: Joi.number().min(0).required()
    })
  ).min(1).required(),
  totalAmount: Joi.number().min(0).required(),
  paymentMethod: Joi.string().valid('credit', 'debit', 'upi').required(),
  shippingAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    zip: Joi.string().required(),
    country: Joi.string().required()
  }).required()
});

const retrySchema = Joi.object({
  jobId: Joi.string().required(),
  maxRetries: Joi.number().min(1).max(10).optional(),
  backoffMultiplier: Joi.number().min(1).optional()
});

const filterSchema = Joi.object({
  status: Joi.string().valid('pending', 'failed', 'archived').optional(),
  since: Joi.date().optional(),
  until: Joi.date().optional(),
  limit: Joi.number().min(1).max(1000).optional(),
  offset: Joi.number().min(0).optional()
});

module.exports = {
  orderSchema,
  retrySchema,
  filterSchema
};

