// ═════════════════════════════════════════════════════════════
// IDEMPOTENCY ROUTES
// Routes with idempotency protection for mutation operations
// ═════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const controller = require('./controller');
const idempotencyMiddleware = require('./middleware');
const authMiddleware = require('../auth'); // Your auth middleware

// Apply auth to all routes
router.use(authMiddleware);

// ─── TRANSACTION ROUTES ───
// Create transaction with idempotency protection
// Usage: POST /transactions with Idempotency-Key header
router.post(
  '/transactions',
  idempotencyMiddleware,
  controller.createTransaction
);

// ─── ORDER ROUTES ───
// Create order with idempotency protection
// Usage: POST /orders with Idempotency-Key header
router.post(
  '/orders',
  idempotencyMiddleware,
  controller.createOrder
);

// ─── WEBHOOK ROUTES ───
// Handle external webhook events with idempotency
// Prevents double-processing of webhook events
// Usage: POST /webhooks with Idempotency-Key header
router.post(
  '/webhooks/events',
  idempotencyMiddleware,
  controller.handleWebhookEvent
);

// ─── SUBSCRIPTION ROUTES ───
// Update subscription with idempotency protection
// Usage: PATCH /subscriptions/:id with Idempotency-Key header
router.patch(
  '/subscriptions/:id',
  idempotencyMiddleware,
  controller.updateSubscription
);

// ─── PASSWORD RESET ───
// Request password reset with idempotency
// Ensures only one reset email per key in 30 minutes
// Usage: POST /auth/password-reset with Idempotency-Key header
router.post(
  '/auth/password-reset',
  idempotencyMiddleware,
  controller.requestPasswordReset
);

module.exports = router;

