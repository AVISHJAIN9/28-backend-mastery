const express = require('express');
const PerformanceController = require('./controller');

const router = express.Router();

router.get('/metrics', (req, res) => PerformanceController.getMetrics(req, res));

module.exports = router;
