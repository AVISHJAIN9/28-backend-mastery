/**
 * Graceful Shutdown - Routes
 */

const express = require('express');
const router = express.Router();

const controller = require('./controller');
const middleware = require('./middleware');

router.use(middleware.requestLogger);
router.use(middleware.errorHandler);

router.get('/api/shutdown/status', controller.getStatus);
router.get('/api/shutdown/slow-op', controller.slowOperation);
router.get('/api/shutdown/db-op', controller.databaseOperation);
router.post('/api/shutdown/graceful', controller.initiateGracefulShutdown);
router.post('/api/shutdown/register-task', controller.registerGracefulTask);
router.get('/api/shutdown/health', controller.healthCheck);
router.post('/api/shutdown/force', controller.forceShutdown);

module.exports = router;
