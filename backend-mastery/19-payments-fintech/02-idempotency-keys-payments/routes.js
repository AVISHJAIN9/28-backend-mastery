const express = require('express');
const router = express.Router();
const controller = require('./controller');
const middleware = require('./middleware');

// POST: Process payment with idempotency key
router.post('/payments', middleware.validateIdempotencyKey, middleware.validatePaymentInput, controller.processPayment);

// GET: Get payment by ID
router.get('/payments/:paymentId', controller.getPayment);

// GET: List all payments
router.get('/payments', controller.listPayments);

// GET: Get idempotency log
router.get('/idempotency/:key', controller.getIdempotencyLog);

// POST: Retry failed payment
router.post('/payments/:paymentId/retry', middleware.validateIdempotencyKey, controller.retryPayment);

module.exports = router;
