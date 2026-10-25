/**
 * process.nextTick vs Promise.resolve - Middleware
 */

// ============================================
// Request Logger
// ============================================

const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};

// ============================================
// Error Handler
// ============================================

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString(),
  });
};

// ============================================
// Async Error Wrapper
// ============================================

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ============================================
// Response Formatter
// ============================================

const responseFormatter = (req, res, next) => {
  res.formatResponse = (data, statusCode = 200) => {
    res.status(statusCode).json({
      success: statusCode < 400,
      data,
      timestamp: new Date().toISOString(),
    });
  };

  next();
};

module.exports = {
  requestLogger,
  errorHandler,
  asyncHandler,
  responseFormatter,
};
