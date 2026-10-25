/**
 * Cluster Module - Routes
 */

const express = require('express');
const router = express.Router();

const controller = require('./controller');
const middleware = require('./middleware');

router.use(middleware.requestLogger);
router.use(middleware.errorHandler);

router.get('/api/cluster/info', controller.getClusterInfo);
router.get('/api/cluster/load-distribution', controller.handleLoadDistribution);
router.get('/api/cluster/task', controller.distributeTask);
router.get('/api/cluster/stats', controller.getClusterStats);
router.get('/api/cluster/communication', controller.communicateWithWorkers);

module.exports = router;
