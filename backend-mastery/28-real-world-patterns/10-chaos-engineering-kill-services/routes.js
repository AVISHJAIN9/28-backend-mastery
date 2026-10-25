const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/kill', controller.killService);
router.post('/restore', controller.restoreService);
router.post('/latency', controller.injectLatency);
router.get('/status', controller.getServiceStatus);
router.post('/reset', controller.resetAllServices);

module.exports = router;
