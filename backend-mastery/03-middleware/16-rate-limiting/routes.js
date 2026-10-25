const express = require('express');
const RateLimitController = require('./controller');
const { generalLimiter } = require('./middleware');

const router = express.Router();

router.get('/info', generalLimiter, (req, res) => RateLimitController.getRateLimitInfo(req, res));
router.get('/test', generalLimiter, (req, res) => RateLimitController.testEndpoint(req, res));

module.exports = router;
