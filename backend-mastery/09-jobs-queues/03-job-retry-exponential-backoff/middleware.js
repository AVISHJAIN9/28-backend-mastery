/**
 * Retry Jobs Middleware
 */

/**
 * Log all requests
 */
const logRequest = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
};

/**
 * Error handler
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};

module.exports = {
  logRequest,
  errorHandler
};

