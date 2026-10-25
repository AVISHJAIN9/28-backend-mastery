const express = require('express');
const router = express.Router();
const controller = require('./controller');
const middleware = require('./middleware');

// POST: Create subscription
router.post('/subscriptions', middleware.validateSubscription, controller.createSubscription);

// GET: Get subscription
router.get('/subscriptions/:subscriptionId', controller.getSubscription);

// POST: Upgrade subscription
router.post('/subscriptions/:subscriptionId/upgrade', middleware.validatePlanChange, controller.upgradeSubscription);

// POST: Downgrade subscription
router.post('/subscriptions/:subscriptionId/downgrade', middleware.validatePlanChange, controller.downgradeSubscription);

// POST: Cancel subscription
router.post('/subscriptions/:subscriptionId/cancel', controller.cancelSubscription);

// GET: Calculate proration
router.post('/subscriptions/:subscriptionId/calculate-proration', controller.calculateProration);

// GET: List subscriptions
router.get('/subscriptions', controller.listSubscriptions);

module.exports = router;
