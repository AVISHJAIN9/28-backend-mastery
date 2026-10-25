/**
 * Async/Await Patterns - Routes
 */

const express = require('express');
const router = express.Router();

const controller = require('./controller');
const middleware = require('./middleware');

router.use(middleware.requestLogger);
router.use(middleware.errorHandler);

router.get('/api/async/basic', controller.basicAsyncPattern);
router.get('/api/async/sequential', controller.sequentialExecution);
router.get('/api/async/parallel', controller.parallelExecution);
router.get('/api/async/error-handling', controller.errorHandling);
router.get('/api/async/iteration', controller.asyncIteration);
router.get('/api/async/race', controller.raceCondition);
router.get('/api/async/pipeline', controller.pipelinePattern);

module.exports = router;
