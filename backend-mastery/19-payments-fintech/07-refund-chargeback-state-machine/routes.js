const express = require('express');
const router = express.Router();
const controller = require('./controller');
const middleware = require('./middleware');

// POST: Initiate refund
router.post('/refunds', middleware.validateRefund, controller.initiateRefund);

// GET: Get refund status
router.get('/refunds/:refundId', controller.getRefundStatus);

// GET: List refunds
router.get('/refunds', controller.listRefunds);

// POST: Process refund
router.post('/refunds/:refundId/process', controller.processRefund);

// POST: Record chargeback
router.post('/chargebacks', middleware.validateChargeback, controller.recordChargeback);

// GET: Get chargeback
router.get('/chargebacks/:chargebackId', controller.getChargeback);

// POST: Submit chargeback defense
router.post('/chargebacks/:chargebackId/defend', controller.submitChargebackDefense);

// GET: Chargeback ratio
router.get('/analytics/chargeback-ratio', controller.getChargebackRatio);

module.exports = router;
