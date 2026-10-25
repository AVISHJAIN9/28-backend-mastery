const express = require('express');
const router = express.Router();
const controller = require('./controller');
const middleware = require('./middleware');

// POST: Tokenize card (never store raw card data)
router.post('/tokenize-card', middleware.validateCardInput, controller.tokenizeCard);

// POST: Process payment with token
router.post('/process-payment', middleware.validateTokenInput, controller.processPaymentWithToken);

// GET: Payment status
router.get('/payments/:paymentId', controller.getPaymentStatus);

// GET: List payments (no card data)
router.get('/payments', controller.listPayments);

// POST: Encrypt sensitive data
router.post('/encrypt', middleware.validateDataInput, controller.encryptData);

// GET: Compliance checklist
router.get('/compliance', controller.getComplianceChecklist);

module.exports = router;
