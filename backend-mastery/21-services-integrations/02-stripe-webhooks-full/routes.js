const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyStripeSignature, validateRequest, validateStripeApiKey, stripeErrorHandler } = require('./middleware');
const { paymentIntentSchema, subscriptionSchema, customerSchema, refundSchema } = require('./schema');

// ==================== Middleware ====================
router.use('/webhook', express.raw({ type: 'application/json' }));
router.use(validateStripeApiKey);

// ==================== Payment Intents ====================

/**
 * POST /api/payments/intent - Create payment intent
 */
router.post('/payments/intent', validateRequest(paymentIntentSchema), controller.createPaymentIntent);

/**
 * GET /api/payments/intent/:paymentIntentId - Get payment intent details
 */
router.get('/payments/intent/:paymentIntentId', controller.getPaymentIntent);

// ==================== Customers ====================

/**
 * POST /api/customers - Create customer
 */
router.post('/customers', validateRequest(customerSchema), controller.createCustomer);

// ==================== Subscriptions ====================

/**
 * POST /api/subscriptions - Create subscription
 */
router.post('/subscriptions', validateRequest(subscriptionSchema), controller.createSubscription);

/**
 * DELETE /api/subscriptions/:subscriptionId - Cancel subscription
 */
router.delete('/subscriptions/:subscriptionId', controller.cancelSubscription);

// ==================== Refunds ====================

/**
 * POST /api/refunds - Create refund
 */
router.post('/refunds', validateRequest(refundSchema), controller.createRefund);

// ==================== Webhooks ====================

/**
 * POST /api/webhook - Stripe webhook endpoint
 * IMPORTANT: This must come BEFORE express.json() middleware
 */
router.post('/webhook', verifyStripeSignature, controller.handleWebhook);

/**
 * GET /api/webhook/events - Get webhook events
 */
router.get('/webhook/events', controller.getWebhookEvents);

// ==================== Error Handler ====================
router.use(stripeErrorHandler);

module.exports = router;
