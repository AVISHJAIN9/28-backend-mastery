const express = require('express');
const RiskBasedAuthController = require('./controller');
const { riskAuthMiddleware } = require('./middleware');

const router = express.Router();

// POST /risk/evaluate - Evaluate risk for login attempt
router.post('/evaluate', (req, res) => {
  RiskBasedAuthController.evaluateRisk(req, res);
});

// POST /risk/authenticate - Adaptive authentication
router.post('/authenticate', (req, res) => {
  RiskBasedAuthController.authenticate(req, res);
});

// POST /risk/challenge/complete - Complete adaptive challenge with MFA
router.post('/challenge/complete', (req, res) => {
  RiskBasedAuthController.completeChallenge(req, res);
});

// POST /risk/device/trust - Mark device as trusted
router.post('/device/trust', riskAuthMiddleware, (req, res) => {
  RiskBasedAuthController.trustDevice(req, res);
});

// GET /risk/profile/:userId - Get user risk profile
router.get('/profile/:userId', riskAuthMiddleware, (req, res) => {
  RiskBasedAuthController.getRiskProfile(req, res);
});

module.exports = router;
