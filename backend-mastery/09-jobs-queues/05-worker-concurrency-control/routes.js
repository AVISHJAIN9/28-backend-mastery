const express = require('express');
const controller = require('./controller');
const router = express.Router();

router.post('/jobs/high', controller.submitHighConcurrencyJob);
router.post('/jobs/low', controller.submitLowConcurrencyJob);
router.get('/status', controller.getWorkerStatus);
router.get('/recommendations', controller.getConcurrencyRecommendations);
router.get('/dashboard', controller.getDashboard);

module.exports = router;
