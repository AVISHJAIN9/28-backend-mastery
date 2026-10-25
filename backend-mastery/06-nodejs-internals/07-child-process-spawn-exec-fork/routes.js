/**
 * Child Process - Routes
 */

const express = require('express');
const router = express.Router();

const controller = require('./controller');
const middleware = require('./middleware');

router.use(middleware.requestLogger);
router.use(middleware.errorHandler);

router.get('/api/child-process/spawn', controller.demonstrateSpawn);
router.get('/api/child-process/exec', controller.demonstrateExec);
router.get('/api/child-process/fork', controller.demonstrateFork);
router.get('/api/child-process/comparison', controller.compareChildProcessTypes);
router.get('/api/child-process/batch', controller.executeBatchCommands);

module.exports = router;
