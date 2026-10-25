/**
 * Event Loop - Middleware
 * Tracks event loop metrics and health
 */

const controller = require('./controller');

// ============================================
// Event Loop Monitoring Middleware
// ============================================

const eventLoopMonitor = () => {
  let lastCheck = Date.now();
  const samples = [];

  return (req, res, next) => {
    const now = Date.now();
    const elapsed = now - lastCheck;

    // Record sample
    samples.push({
      timestamp: new Date(now),
      elapsed,
      health: elapsed < 20 ? 'healthy' : elapsed < 100 ? 'acceptable' : 'concerning',
    });

    // Keep last 1000 samples
    if (samples.length > 1000) {
      samples.shift();
    }

    // Attach to request for logging
    req.eventLoopSample = {
      elapsed,
      sampleCount: samples.length,
      avgElapsed:
        samples.length > 0
          ? (samples.reduce((sum, s) => sum + s.elapsed, 0) / samples.length).toFixed(2)
          : 0,
    };

    // Warn if lag detected
    if (elapsed > 100) {
      console.warn(`🚨 Event loop lag detected: ${elapsed}ms`);
    }

    lastCheck = now;
    next();
  };
};

// ============================================
// Error Handler
// ============================================

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  res.status(500).json({
    error: err.message,
    timestamp: new Date(),
    eventLoopLag: req.eventLoopSample?.elapsed || 0,
  });
};

// ============================================
// Validation Middleware
// ============================================

const validatePhaseDemo = (req, res, next) => {
  const { phase } = req.query;

  if (phase && !['timers', 'pending', 'poll', 'check', 'close'].includes(phase)) {
    return res.status(400).json({
      error: 'Invalid phase. Must be: timers, pending, poll, check, or close',
    });
  }

  next();
};

// ============================================
// Request Logger
// ============================================

const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${new Date().toISOString()} | ${req.method} ${req.path} | ${duration}ms | ${res.statusCode}`
    );
  });

  next();
};

// ============================================
// Health Check Middleware
// ============================================

const healthCheck = (req, res, next) => {
  const health = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid,
    timestamp: new Date(),
  };

  res.locals.health = health;
  next();
};

module.exports = {
  eventLoopMonitor,
  errorHandler,
  validatePhaseDemo,
  requestLogger,
  healthCheck,
};

