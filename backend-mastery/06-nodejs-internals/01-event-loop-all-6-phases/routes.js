/**
 * Event Loop - Routes
 * Define endpoints for event loop demonstrations
 */

const express = require('express');
const router = express.Router();

const controller = require('./controller');
const middleware = require('./middleware');

// ============================================
// Middleware Setup
// ============================================

router.use(middleware.requestLogger);
router.use(middleware.eventLoopMonitor());
router.use(middleware.healthCheck);

// ============================================
// Event Loop Phase Routes
// ============================================

/**
 * GET /api/event-loop/timers
 * Demonstrate timers phase (setTimeout, setInterval)
 */
router.get('/api/event-loop/timers', controller.demonstrateTimersPhase);

/**
 * GET /api/event-loop/pending
 * Demonstrate pending callbacks and poll phase
 */
router.get('/api/event-loop/pending', controller.demonstratePendingCallbacks);

/**
 * GET /api/event-loop/poll
 * Explain poll phase
 */
router.get('/api/event-loop/poll', controller.demonstratePollPhase);

/**
 * GET /api/event-loop/check
 * Demonstrate check phase (setImmediate)
 */
router.get('/api/event-loop/check', controller.demonstrateCheckPhase);

/**
 * GET /api/event-loop/close
 * Demonstrate close phase
 */
router.get('/api/event-loop/close', controller.demonstrateClosePhase);

/**
 * GET /api/event-loop/execution-order
 * Show callback execution order
 */
router.get('/api/event-loop/execution-order', controller.demonstrateExecutionOrder);

/**
 * GET /api/event-loop/lag
 * Detect event loop lag
 */
router.get('/api/event-loop/lag', controller.demonstrateEventLoopLag);

/**
 * GET /api/event-loop/micro-vs-macro
 * Compare microtasks vs macrotasks
 */
router.get('/api/event-loop/micro-vs-macro', controller.demonstrateMicrovsMacro);

/**
 * GET /api/event-loop/metrics
 * Get current metrics
 */
router.get('/api/event-loop/metrics', controller.getMetrics);

/**
 * POST /api/event-loop/reset
 * Reset metrics
 */
router.post('/api/event-loop/reset', controller.resetMetrics);

// ============================================
// Health Check Routes
// ============================================

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    health: res.locals.health,
  });
});

/**
 * GET /api/health/detailed
 * Detailed health information
 */
router.get('/api/health/detailed', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: {
      rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}MB`,
      heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)}MB`,
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`,
      external: `${(process.memoryUsage().external / 1024 / 1024).toFixed(2)}MB`,
    },
    pid: process.pid,
    platform: process.platform,
    nodeVersion: process.version,
    timestamp: new Date(),
  });
});

// ============================================
// Error Handler (must be last)
// ============================================

router.use(middleware.errorHandler);

module.exports = router;

