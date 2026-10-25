/**
 * Blocking Event Loop - Middleware
 */

// ============================================
// Request Logger
// ============================================

const requestLogger = (req, res, next) => {
  const start = Date.now();
  console.log(`→ ${req.method} ${req.path} ${new Date().toISOString()}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`← ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`);
  });

  next();
};

// ============================================
// Error Handler
// ============================================

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString(),
  });
};

// ============================================
// Timeout Middleware
// ============================================

const timeoutMiddleware = (timeoutMs = 30000) => {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request timeout',
          timeoutMs,
        });
      }
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

module.exports = {
  requestLogger,
  errorHandler,
  timeoutMiddleware,
};
