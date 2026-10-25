/**
 * process.nextTick vs Promise.resolve - Routes
 */

const express = require('express');
const router = express.Router();

const controller = require('./controller');
const middleware = require('./middleware');

// ============================================
// Middleware Setup
// ============================================

router.use(middleware.requestLogger);
router.use(middleware.errorHandler);

// ============================================
// Demonstration Routes
// ============================================

/**
 * GET /api/microtasks/basic-order
 * Demonstrate basic execution order: sync -> nextTick -> Promise -> setTimeout
 */
router.get('/api/microtasks/basic-order', controller.demonstrateBasicOrder);

/**
 * GET /api/microtasks/nested
 * Demonstrate nested microtask callbacks
 */
router.get('/api/microtasks/nested', controller.demonstrateNestedCallbacks);

/**
 * GET /api/microtasks/queue-flushing
 * Demonstrate complete microtask queue flushing
 */
router.get('/api/microtasks/queue-flushing', controller.demonstrateQueueFlushing);

/**
 * GET /api/microtasks/performance
 * Compare performance of nextTick vs Promise
 * Query: iterations=10000
 */
router.get('/api/microtasks/performance', controller.comparePerformance);

/**
 * GET /api/microtasks/error-handling
 * Demonstrate error handling in microtasks
 */
router.get('/api/microtasks/error-handling', controller.demonstrateErrorHandling);

/**
 * GET /api/microtasks/queue-depth
 * Analyze microtask queue depth
 * Query: depth=5
 */
router.get('/api/microtasks/queue-depth', controller.analyzeMicrotaskQueueDepth);

/**
 * GET /api/microtasks/real-world
 * Real-world example: request handling with microtasks
 */
router.get('/api/microtasks/real-world', controller.realWorldExample);

module.exports = router;
