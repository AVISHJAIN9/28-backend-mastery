const express = require('express');
const router = express.Router();
const controller = require('./controller');
const middleware = require('./middleware');

// POST: Create seller account
router.post('/sellers', middleware.validateSeller, controller.createSellerAccount);

// GET: Get seller account
router.get('/sellers/:sellerId', controller.getSellerAccount);

// POST: Create account link for onboarding
router.post('/sellers/:sellerId/onboarding-link', controller.createOnboardingLink);

// POST: Process marketplace charge
router.post('/charges', middleware.validateCharge, controller.processCharge);

// POST: Transfer to seller
router.post('/transfers', middleware.validateTransfer, controller.createTransfer);

// GET: Seller dashboard
router.get('/sellers/:sellerId/dashboard', controller.getSellerDashboard);

// GET: Seller balance
router.get('/sellers/:sellerId/balance', controller.getSellerBalance);

// POST: Handle dispute
router.post('/disputes', middleware.validateDispute, controller.recordDispute);

// GET: List disputes
router.get('/disputes', controller.listDisputes);

module.exports = router;
