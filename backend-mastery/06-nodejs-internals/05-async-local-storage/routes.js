/**
 * AsyncLocalStorage - Routes
 */

const express = require('express');
const router = express.Router();

const controller = require('./controller');
const middleware = require('./middleware');

router.use(middleware.requestLogger);
router.use(middleware.errorHandler);

router.get('/api/context/basic', controller.demonstrateBasicStorage);
router.get('/api/context/request-tracking', controller.trackRequestContext);
router.get('/api/context/nested', controller.demonstrateNestedContexts);
router.get('/api/context/error', controller.demonstrateErrorContext);
router.get('/api/context/performance', controller.trackContextPerformance);

module.exports = router;
