/**
 * Buffers and Streams - Middleware
 */

// ============================================
// Request Logger
// ============================================

const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();
  console.log(`→ [${new Date().toISOString()}] ${req.method} ${req.path}`);

  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1000000;
    console.log(`← ${res.statusCode} (${duration.toFixed(2)}ms)`);
  });

  next();
};

// ============================================
// Error Handler
// ============================================

const errorHandler = (err, req, res, next) => {
  console.error('❌ Stream Error:', err.message);

  res.status(500).json({
    error: 'Stream operation failed',
    message: err.message,
    code: err.code,
    timestamp: new Date().toISOString(),
  });
};

// ============================================
// Stream Cleanup Middleware
// ============================================

const streamCleanup = (req, res, next) => {
  // Store active streams for cleanup
  res.activeStreams = [];

  res.on('finish', () => {
    res.activeStreams.forEach((stream) => {
      if (!stream.destroyed) {
        stream.destroy();
      }
    });
  });

  next();
};

module.exports = {
  requestLogger,
  errorHandler,
  streamCleanup,
};
