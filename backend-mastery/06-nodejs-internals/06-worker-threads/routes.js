/**
 * Worker Threads - Routes
 */

const express = require('express');
const router = express.Router();

const controller = require('./controller');
const middleware = require('./middleware');

router.use(middleware.requestLogger);
router.use(middleware.errorHandler);

router.get('/api/workers/single', controller.runWorkerTask);
router.get('/api/workers/pool', controller.runWorkerPool);
router.get('/api/workers/comparison', controller.compareWorkerVsMain);

module.exports = router;
