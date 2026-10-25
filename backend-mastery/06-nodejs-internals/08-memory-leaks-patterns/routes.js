/**
 * Memory Leaks Patterns - Routes
 */

const express = require('express');
const router = express.Router();

const controller = require('./controller');
const middleware = require('./middleware');

router.use(middleware.requestLogger);
router.use(middleware.errorHandler);

router.get('/api/memory/closure-leak', controller.demonstrateClosureLeak);
router.get('/api/memory/event-listener-leak', controller.demonstrateEventListenerLeak);
router.get('/api/memory/timer-leak', controller.demonstrateTimerLeak);
router.get('/api/memory/circular-reference-leak', controller.demonstrateCircularReferenceLeak);
router.get('/api/memory/cache-leak', controller.demonstrateCacheLeak);
router.get('/api/memory/profile', controller.profileMemory);
router.post('/api/memory/cleanup', controller.cleanupLeaks);

module.exports = router;
