const express = require('express');
const SanitizationController = require('./controller');
const { sanitizationMiddleware } = require('./middleware');

const router = express.Router();

router.post('/test', sanitizationMiddleware, (req, res) => SanitizationController.testSanitization(req, res));

module.exports = router;
