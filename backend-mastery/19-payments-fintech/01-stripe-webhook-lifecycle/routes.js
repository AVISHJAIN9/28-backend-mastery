const express = require('express');
const router = express.Router();
const controller = require('./controller');
const middleware = require('./middleware');

// ==================== Webhook Routes ====================

// POST: Handle Stripe webhook
router.post('/webhooks/stripe', middleware.verifyStripeSignature, controller.handleWebhook);

// ==================== Order Routes ====================

// GET: List all orders
router.get('/orders', controller.listOrders);

// GET: Get specific order
router.get('/orders/:orderId', controller.getOrder);

// POST: Create order
router.post('/orders', middleware.validateOrderInput, controller.createOrder);

// ==================== Payment Routes ====================

// GET: List payments
router.get('/payments', controller.listPayments);

// POST: Process payment
router.post('/payments', middleware.validatePaymentInput, controller.processPayment);

// ==================== Webhook Event Routes ====================

// GET: List webhook events
router.get('/webhook-events', controller.listWebhookEvents);

// GET: Get specific webhook event
router.get('/webhook-events/:eventId', controller.getWebhookEvent);

// ==================== Health & Status ====================

// GET: Test webhook endpoint
router.get('/test-webhook', controller.testWebhook);

module.exports = router;
