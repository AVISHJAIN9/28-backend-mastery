/**
 * Blocking Event Loop - Routes
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
// Blocking Operations Routes
// ============================================

/**
 * GET /api/blocking/cpu
 * Demonstrate blocking CPU-intensive operation
 * Query: iterations=1000000000
 */
router.get('/api/blocking/cpu', controller.demonstrateBlocking);

/**
 * GET /api/blocking/nonblocking-immediate
 * Non-blocking with setImmediate
 * Query: iterations=1000000000, chunkSize=100000000
 */
router.get('/api/blocking/nonblocking-immediate', controller.demonstrateNonBlockingImmediate);

/**
 * GET /api/blocking/nonblocking-timeout
 * Non-blocking with setTimeout
 * Query: iterations=1000000000, chunkSize=100000000, delay=0
 */
router.get('/api/blocking/nonblocking-timeout', controller.demonstrateNonBlockingTimeout);

/**
 * GET /api/blocking/nonblocking-promise
 * Non-blocking with Promises
 * Query: iterations=1000000000, chunkSize=100000000
 */
router.get('/api/blocking/nonblocking-promise', controller.demonstrateNonBlockingPromise);

/**
 * GET /api/blocking/responsiveness
 * Test event loop responsiveness
 * Query: duration=5000
 */
router.get('/api/blocking/responsiveness', controller.testEventLoopResponsiveness);

/**
 * GET /api/blocking/comparison
 * Compare blocking vs non-blocking approaches
 */
router.get('/api/blocking/comparison', controller.compareBlockingVsNonBlocking);

/**
 * GET /api/blocking/metrics
 * Get event loop metrics
 */
router.get('/api/blocking/metrics', controller.getMetrics);

module.exports = router;
