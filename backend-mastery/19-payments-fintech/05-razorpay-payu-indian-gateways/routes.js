const express = require('express');
const router = express.Router();
const controller = require('./controller');
const middleware = require('./middleware');

// POST: Create Razorpay order
router.post('/razorpay/orders', middleware.validateRazorpayOrder, controller.createRazorpayOrder);

// POST: Verify Razorpay payment
router.post('/razorpay/verify', controller.verifyRazorpayPayment);

// GET: List Razorpay orders
router.get('/razorpay/orders', controller.listRazorpayOrders);

// POST: Create PayU payment link
router.post('/payu/payment-links', middleware.validatePayUPayment, controller.createPayUPaymentLink);

// POST: Handle PayU callback
router.post('/payu/callback', controller.handlePayUCallback);

// GET: Payment methods
router.get('/payment-methods', controller.getPaymentMethods);

// GET: Settlement status
router.get('/settlements', controller.getSettlementStatus);

module.exports = router;
