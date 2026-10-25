/**
 * Graceful Shutdown - Middleware
 */

let requestCount = 0;

const requestLogger = (req, res, next) => {
  const start = Date.now();
  requestCount++;
  console.log(`[${requestCount}] → ${req.method} ${req.path}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${requestCount}] ← ${res.statusCode} (${duration}ms)`);
  });

  next();
};

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
};

module.exports = { requestLogger, errorHandler };
