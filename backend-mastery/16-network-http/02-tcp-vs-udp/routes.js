const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { connectionTracker, protocolValidator } = require('./middleware');

router.use(connectionTracker);
router.use(protocolValidator);

router.get('/tcp-info', controller.getTcpInfo);
router.get('/udp-info', controller.getUdpInfo);
router.get('/compare', controller.compareProtocols);
router.post('/simulate-loss', controller.simulatePacketLoss);
router.get('/metrics', controller.getMetrics);

module.exports = router;

