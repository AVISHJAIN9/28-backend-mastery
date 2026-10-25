const Joi = require('joi');

// ==================== Payment Intent Schema ====================
const paymentIntentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).default('usd'),
  paymentMethod: Joi.string().required(),
  description: Joi.string().max(1000),
  metadata: Joi.object().unknown(),
  receipt_email: Joi.string().email(),
  confirm: Joi.boolean().default(true),
});

// ==================== Subscription Schema ====================
const subscriptionSchema = Joi.object({
  customer: Joi.string().required(),
  items: Joi.array().items({
    price: Joi.string().required(),
    quantity: Joi.number().default(1),
  }).required(),
  trialPeriodDays: Joi.number().min(0),
  billingCycleAnchor: Joi.date(),
  metadata: Joi.object().unknown(),
});

// ==================== Customer Schema ====================
const customerSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().max(255),
  description: Joi.string().max(1000),
  paymentMethod: Joi.string(),
  metadata: Joi.object().unknown(),
});

// ==================== Refund Schema ====================
const refundSchema = Joi.object({
  chargeId: Joi.string().required(),
  amount: Joi.number().positive(),
  reason: Joi.string().valid('duplicate', 'fraudulent', 'requested_by_customer'),
  metadata: Joi.object().unknown(),
});

// ==================== Invoice Schema ====================
const invoiceSchema = Joi.object({
  customerId: Joi.string().required(),
  subscriptionId: Joi.string(),
  description: Joi.string(),
  metadata: Joi.object().unknown(),
});

module.exports = {
  paymentIntentSchema,
  subscriptionSchema,
  customerSchema,
  refundSchema,
  invoiceSchema,
};
