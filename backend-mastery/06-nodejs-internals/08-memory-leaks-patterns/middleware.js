/**
 * Memory Leaks Patterns - Middleware
 */

const requestLogger = (req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  res.on('finish', () => console.log(`${res.statusCode} (${Date.now() - start}ms)`));
  next();
};

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
};

module.exports = { requestLogger, errorHandler };
